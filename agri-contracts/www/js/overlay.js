// طبقات فوق الشاشة (مثل عارض المستند) تُغلق بزر الرجوع في الهاتف.
// كل طبقة تضيف خطوة في سجل التصفح؛ الرجوع يغلق الأعلى بدل مغادرة الشاشة.

const stack = [];

export function openOverlay(close) {
  stack.push(close);
  history.pushState({ ...(history.state || {}), overlay: true }, '');
}

/** يُستدعى من مستمع popstate: يغلق الطبقة العليا إن وُجدت. */
export function closeTopOverlay() {
  const close = stack.pop();
  if (!close) return false;
  close();
  return true;
}

/** إزالة طبقة من القائمة دون إغلاق — حين تُغلق بطريق آخر غير الرجوع. */
export function forgetOverlay(close) {
  const i = stack.lastIndexOf(close);
  if (i >= 0) stack.splice(i, 1);
}
