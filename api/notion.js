export const config = { api: { bodyParser: true } };

// Database ID de "Tracking Apports d'affaires"
const DB_ID = 'f3a44edf-8893-4b60-bb5a-6ff3665883df';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN non configuré sur Vercel' });

  try {
    let allResults = [];
    let hasMore = true;
    let startCursor;

    // Pagination : récupère TOUTES les entrées de Hugo (max 100 par appel Notion)
    while (hasMore) {
      const payload = {
        sorts: [{ property: 'Date', direction: 'ascending' }],
        filter: {
          property: 'Apporteur',
          rich_text: { equals: 'Hugo Declimmer' }
        }
      };
      if (startCursor) payload.start_cursor = startCursor;

      const response = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        return res.status(response.status).json(errData);
      }

      const data = await response.json();
      allResults = allResults.concat(data.results || []);
      hasMore = data.has_more === true;
      startCursor = data.next_cursor || undefined;
    }

    return res.status(200).json({ results: allResults, count: allResults.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
