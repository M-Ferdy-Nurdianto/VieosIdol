const eventOptionBadge = (ev) => {
  const t = (ev?.type || '').toString().toLowerCase();
  return {
    badge: t === 'special' ? '★ Spesial' : '● Biasa',
    badgeKind: t === 'special' ? 'special' : 'regular'
  };
};

export { eventOptionBadge };
