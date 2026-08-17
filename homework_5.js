import { calculateSimilarityMatrix, cosineSimilarity } from "./tools/embeddings.js";

console.log("=== Homework 5：Embeddings API 相似度計算 ===\n");

/**
 * 測試組別定義
 */
const testGroups = {
  group1: {
    name: "第 1 組：意思相近的句子",
    texts: ["我喜歡貓", "貓咪很可愛", "我養了一隻貓"],
  },
  group2: {
    name: "第 2 組：意思不同的句子",
    texts: ["今天天氣很好", "我要去買菜", "電腦壞了"],
  },
  group3: {
    name: "第 3 組：部分相關的句子",
    texts: ["我喜歡狗", "我帶狗去散步", "我買了一包貓飼料"],
  },
};

/**
 * 美化輸出相似度矩陣
 */
function printSimilarityMatrix(group, result) {
  console.log(`\n📊 ${group.name}`);
  console.log("─".repeat(60));

  // 列印文字標籤
  console.log("文字內容：");
  result.texts.forEach((text, index) => {
    console.log(`  [${index}] ${text}`);
  });

  console.log("\n相似度矩陣：");

  // 列印表頭
  const headerPadding = "       ";
  let header = headerPadding;
  for (let j = 0; j < result.texts.length; j++) {
    header += `[${j}]      `;
  }
  console.log(header);

  // 列印矩陣
  for (let i = 0; i < result.similarityMatrix.length; i++) {
    let row = `[${i}]     `;
    for (let j = 0; j < result.similarityMatrix[i].length; j++) {
      const similarity = result.similarityMatrix[i][j];
      row += similarity.toFixed(4) + " ";
    }
    console.log(row);
  }

  // 分析結果
  console.log("\n📈 相似度分析：");
  const similarities = [];
  for (let i = 0; i < result.texts.length; i++) {
    for (let j = i + 1; j < result.texts.length; j++) {
      similarities.push({
        pair: `[${i}] vs [${j}]`,
        text1: result.texts[i],
        text2: result.texts[j],
        similarity: result.similarityMatrix[i][j],
      });
    }
  }

  // 按相似度排序
  similarities.sort((a, b) => b.similarity - a.similarity);

  similarities.forEach((item) => {
    const bar = "█".repeat(Math.round(item.similarity * 20));
    console.log(
      `  ${item.pair}: ${item.similarity.toFixed(4)} ${bar}`
    );
  });
}

/**
 * 主程式
 */
async function main() {
  try {
    // 測試所有組別
    for (const [key, group] of Object.entries(testGroups)) {
      console.log("\n" + "═".repeat(60));
      const result = await calculateSimilarityMatrix(group.texts);
      printSimilarityMatrix(group, result);
    }

    // 最終結論
    console.log("\n" + "═".repeat(60));
    console.log("\n✅ 結論：");
    console.log(
      "- 第 1 組（意思相近的句子）：相似度應該較高（通常 > 0.7）"
    );
    console.log(
      "- 第 2 組（意思不同的句子）：相似度應該較低（通常 < 0.5）"
    );
    console.log("- 第 3 組（自定義測試案例）：相似度符合語義預期");
  } catch (error) {
    console.error("\n❌ 錯誤：", error.message);
    process.exit(1);
  }
}

main();
