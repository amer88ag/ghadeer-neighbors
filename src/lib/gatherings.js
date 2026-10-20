/* حذف التجمعات (اقتراح طلعة، موعد طلعة، مناسبة) عبر دالة واحدة في قاعدة البيانات. */
import { confirmBox, toast } from './dom.js';
import { state, canManage, requirePin, creds } from './session.js';
import { call } from './api.js';

const LABEL = { plan: 'الاقتراح', outing: 'موعد الطلعة', event: 'المناسبة' };

/** هل يظهر زر الحذف؟ الإدارة لكل شيء، والعضو لاقتراحه غير المعتمد فقط. التحقق النهائي في الخادم. */
export function canDelete(kind, row) {
  if (canManage()) return true;
  return kind === 'plan' && !!state.user && Number(row?.created_by) === Number(state.user.id) && row?.status !== 'scheduled';
}

export const deleteBtn = (kind, id) => `<button class="small-btn ghost danger-text" data-del="${kind}" data-id="${id}">🗑️ حذف</button>`;

/** يطلب التأكيد ثم يحذف. يعيد true عند النجاح. */
export async function deleteGathering(kind, id) {
  if (!(await confirmBox(`حذف ${LABEL[kind]} نهائيًا مع كل ما يتعلق به (التصويت والمصروفات والتقييمات)؟`, { okText: '🗑️ حذف' }))) return false;
  let auth;
  if (state.manager) auth = { p_manager_pin: state.pin };
  else { if (!(await requirePin())) return false; auth = creds(); }
  const r = await call('delete_gathering', { p_kind: kind, p_id: Number(id), ...auth });
  if (!r.ok) { toast(r.message, false); return false; }
  toast(`تم حذف ${LABEL[kind]}.`);
  return true;
}
