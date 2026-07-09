// Embeddings do RAG (Fase 10) via Gemini text-embedding-004 (768 dimensões, mesmo tamanho da
// coluna `embedding vector(768)` em prospeccao_agent_knowledge). Só Gemini — mesma limitação já
// existente pro function-calling do agente (Fase 4): é o único provider testável hoje.

export async function gerarEmbedding(apiKey: string, baseUrl: string, texto: string): Promise<number[]> {
  const res = await fetch(`${baseUrl}/models/text-embedding-004:embedContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: { parts: [{ text: texto }] } }),
  });
  if (!res.ok) {
    const detalhe = await res.text();
    throw new Error(`Gemini embedding respondeu ${res.status}: ${detalhe}`);
  }
  const data = await res.json();
  const values = data.embedding?.values;
  if (!Array.isArray(values)) throw new Error("Resposta de embedding sem values");
  return values;
}
