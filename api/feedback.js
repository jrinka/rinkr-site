export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passage, response } = req.body ?? {};
  if (!passage || !response) {
    return res.status(400).json({ error: 'Missing passage or response' });
  }

  const prompt = `You are an IB English teacher giving brief feedback on a student's literary analysis. The student analysed a short passage.

Passage:
${passage}

Student's analysis:
${response}

Write 2–3 sentences of specific, constructive feedback. Acknowledge what works, then give one concrete suggestion for improvement. Be direct and encouraging. Plain paragraph only — no bullet points, no headers.`;

  let apiRes;
  try {
    apiRes = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_APIKEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    });
  } catch (err) {
    console.error('MiniMax fetch error:', err);
    return res.status(502).json({ error: 'Could not reach AI service' });
  }

  if (!apiRes.ok) {
    const body = await apiRes.text();
    console.error('MiniMax error response:', apiRes.status, body);
    return res.status(502).json({ error: 'AI service returned an error', detail: body });
  }

  const data = await apiRes.json();
  console.log('MiniMax response:', JSON.stringify(data));
  // Native MiniMax format uses choices[0].messages[0].content (plural)
  const feedback = (
    data.choices?.[0]?.messages?.[0]?.content ??
    data.choices?.[0]?.message?.content
  )?.trim();
  if (!feedback) {
    return res.status(502).json({ error: 'Empty response from AI', raw: data });
  }

  return res.status(200).json({ feedback });
}
