import { input } from "@inquirer/prompts";
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { getEmbedding, cosineSimilarity } from "./tools/embeddings.js";

const PDF_PATH = new URL("./咖啡飲品介紹.pdf", import.meta.url);
const TOP_K = 3;

function splitText(text, maxLength = 700) {
  const pages = text.split(/\f/);
  const chunks = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const paragraphs = pages[pageIndex]
      .replace(/-- \d+ of \d+ --/g, "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    let current = "";
    for (const paragraph of paragraphs) {
      if ((current + " " + paragraph).trim().length <= maxLength) {
        current = `${current} ${paragraph}`.trim();
        continue;
      }

      if (current) {
        chunks.push({ page: pageIndex + 1, text: current });
      }
      current = paragraph;
    }

    if (current) {
      chunks.push({ page: pageIndex + 1, text: current });
    }
  }

  return chunks;
}

function getSearchTerms(query) {
  const terms = [];
  for (const match of query.toLowerCase().matchAll(/[\u4e00-\u9fff]{2,}|[a-z0-9]+/gi)) {
    const term = match[0];
    terms.push(term);
    if (/^[\u4e00-\u9fff]+$/.test(term) && term.length > 2) {
      for (let index = 0; index < term.length - 1; index += 1) {
        terms.push(term.slice(index, index + 2));
      }
    }
  }
  return [...new Set(terms)];
}

function keywordScore(text, terms) {
  const normalizedText = text.toLowerCase();
  return terms.reduce((score, term) => {
    let occurrences = 0;
    let position = normalizedText.indexOf(term);
    while (position !== -1) {
      occurrences += 1;
      position = normalizedText.indexOf(term, position + term.length);
    }
    return score + Math.min(occurrences, 3);
  }, 0);
}

class CoffeeVectorDatabase {
  constructor(chunks) {
    this.chunks = chunks;
  }

  async build() {
    console.log(`正在建立 ${this.chunks.length} 個知識片段的向量...`);
    for (const [index, chunk] of this.chunks.entries()) {
      chunk.embedding = await getEmbedding(chunk.text);
      process.stdout.write(`\r已完成 ${index + 1}/${this.chunks.length}`);
    }
    console.log("\n向量資料庫建立完成。\n");
  }

  keywordSearch(query, limit = TOP_K) {
    const terms = getSearchTerms(query);
    return this.chunks
      .map((chunk) => ({ ...chunk, score: keywordScore(chunk.text, terms) }))
      .filter((chunk) => chunk.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, limit);
  }

  async semanticSearch(query, limit = TOP_K) {
    const queryEmbedding = await getEmbedding(query);
    return this.chunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((first, second) => second.score - first.score)
      .slice(0, limit);
  }

  async hybridSearch(query, limit = TOP_K) {
    const terms = getSearchTerms(query);
    const queryEmbedding = await getEmbedding(query);
    const scoredChunks = this.chunks.map((chunk) => ({
      ...chunk,
      keyword: keywordScore(chunk.text, terms),
      semantic: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));
    const maxKeyword = Math.max(...scoredChunks.map((chunk) => chunk.keyword), 1);

    return scoredChunks
      .map((chunk) => ({
        ...chunk,
        score: (chunk.keyword / maxKeyword) * 0.4 + chunk.semantic * 0.6,
      }))
      .sort((first, second) => second.score - first.score)
      .slice(0, limit);
  }
}

function printResults(title, results) {
  console.log(`\n${title}`);
  if (results.length === 0) {
    console.log("找不到相關內容。");
    return;
  }

  results.forEach((result, index) => {
    console.log(`${index + 1}. [第 ${result.page} 頁] 分數：${result.score.toFixed(4)}`);
    console.log(`   ${result.text.slice(0, 240)}${result.text.length > 240 ? "..." : ""}`);
  });
}

async function loadPdfText() {
  const parser = new PDFParse({ data: await readFile(PDF_PATH) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function main() {
  console.log("=== Homework 3：咖啡飲品 PDF 向量搜尋 ===\n");
  console.log("資料來源：咖啡飲品介紹.pdf");
  console.log("搜尋方式：關鍵字、Embedding 語意、混合搜尋");
  console.log("輸入 exit 結束。\n");

  const chunks = splitText(await loadPdfText());
  if (chunks.length === 0) {
    throw new Error("PDF 沒有可用的文字內容");
  }

  const database = new CoffeeVectorDatabase(chunks);
  await database.build();

  while (true) {
    const query = (await input({ message: "請輸入咖啡問題：" })).trim();
    if (!query) continue;
    if (query.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    try {
      printResults("【1. 關鍵字搜尋】", database.keywordSearch(query));
      printResults("【2. Embedding 語意搜尋】", await database.semanticSearch(query));
      printResults("【3. 混合搜尋】", await database.hybridSearch(query));
    } catch (error) {
      console.error(`\n❌ 搜尋失敗：${error.message}\n`);
    }
  }
}

main().catch((error) => {
  console.error(`\n❌ 程式執行失敗：${error.message}`);
  process.exitCode = 1;
});