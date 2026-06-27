export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passage, response } = req.body ?? {};
  if (!passage || !response) {
    return res.status(400).json({ error: 'Missing passage or response' });
  }

  const prompt = `You are an IB English teacher giving brief feedback on a student's literary analysis. The student was shown a short passage and asked to analyse it.

Passage:
${passage}

Student's response:
${response}

Before giving feedback, check for these cases and respond accordingly if any apply:
- If the response is copied or nearly identical to the passage itself, start with: "This appears to be the passage copied verbatim, not an analysis."
- If the response has nothing to do with the passage or literary analysis (e.g. off-topic questions, nonsense, inappropriate content), start with: "This doesn't appear to be a literary analysis of the passage." Then stop — do not give literary feedback.
- If the response is appropriate, write 2–3 sentences of specific, constructive feedback. Acknowledge what works, then give one concrete suggestion for improvement.

Be direct. Plain paragraph only — no bullet points, no headers.`;

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
        max_tokens: 2000,
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
