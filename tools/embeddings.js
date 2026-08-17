import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config.js";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * 使用 OpenAI Embeddings API 將文字轉換為向量
 * @param {string} text - 要轉換的文字
 * @returns {Promise<number[]>} 文字的向量表示
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("文字內容不能為空");
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(`無法取得文字向量：${error.message}`);
  }
}

/**
 * 計算兩個向量之間的餘弦相似度
 * 公式：cos(A, B) = (A · B) / (||A|| * ||B||)
 * @param {number[]} vectorA - 第一個向量
 * @param {number[]} vectorB - 第二個向量
 * @returns {number} 相似度值 (0 到 1 之間)
 */
export function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    throw new Error("向量必須是數組");
  }

  if (vectorA.length !== vectorB.length) {
    throw new Error("兩個向量的維度必須相同");
  }

  if (vectorA.length === 0) {
    throw new Error("向量不能為空");
  }

  // 計算點積 (dot product)
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  // 計算向量的模 (magnitude)
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // 避免除以零
  if (magnitudeA === 0 || magnitudeB === 0) {
    throw new Error("向量的模不能為零");
  }

  // 計算餘弦相似度
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 計算多個文字之間的相似度矩陣
 * @param {string[]} texts - 文字陣列
 * @returns {Promise<Object>} 包含向量和相似度矩陣的結果
 */
export async function calculateSimilarityMatrix(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("必須提供至少一個文字");
  }

  console.log(`正在獲取 ${texts.length} 個文字的向量...`);

  // 獲取所有文字的向量
  const embeddings = await Promise.all(
    texts.map(async (text, index) => {
      try {
        const embedding = await getEmbedding(text);
        return embedding;
      } catch (error) {
        throw new Error(`第 ${index + 1} 個文字處理失敗：${error.message}`);
      }
    })
  );

  // 計算相似度矩陣
  const similarityMatrix = [];
  for (let i = 0; i < texts.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < texts.length; j++) {
      if (i === j) {
        similarityMatrix[i][j] = 1.0; // 自己與自己的相似度為 1
      } else {
        similarityMatrix[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
      }
    }
  }

  return {
    texts,
    embeddings,
    similarityMatrix,
  };
}
