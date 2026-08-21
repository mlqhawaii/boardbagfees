export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name = '', email = '', subject = '', message = '' } = req.body || {};
    const cleanName = String(name).trim().slice(0, 120);
    const cleanEmail = String(email).trim().slice(0, 254);
    const cleanSubject = String(subject).trim().slice(0, 200);
    const cleanMessage = String(message).trim().slice(0, 5000);

    if (!cleanEmail || !cleanMessage) return res.status(400).json({ error: 'Email and message are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return res.status(500).json({ error: 'Contact service is not configured.' });

    const response = await fetch(`${url}/rest/v1/boardbagfees_contact_messages`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: cleanName || null, email: cleanEmail, subject: cleanSubject || null, message: cleanMessage })
    });

    if (!response.ok) { console.error('Supabase contact error:', await response.text()); return res.status(500).json({ error: 'Unable to send message.' }); }
    return res.status(200).json({ success: true });
  } catch (error) { console.error(error); return res.status(500).json({ error: 'Unable to send message.' }); }
}
