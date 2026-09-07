import { getAuthenticatedUser, listUsers, removeUser, requireAdmin, updateUserStatus } from './auth';
export default async function admin(req: any, res: any) {
  const actor = await requireAdmin(req, res); if (!actor) return;
  const parts = (req.path || '').split('/').filter(Boolean);
  const id = parts[parts.length - 1] !== 'users' ? parts[parts.length - 1] : undefined;
  if (req.method === 'GET') return res.json({ success: true, users: await listUsers() });
  if (!id) return res.status(400).json({ success: false, message: 'Usuário inválido.' });
  if (req.method === 'PATCH') { const status = req.body?.status; if (!['aprovado', 'recusado'].includes(status)) return res.status(400).json({ success: false }); await updateUserStatus(id, status); return res.json({ success: true }); }
  if (req.method === 'DELETE') { await removeUser(id); return res.json({ success: true }); }
  return res.status(405).json({ success: false });
}
void getAuthenticatedUser;
