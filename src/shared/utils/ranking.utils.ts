export function maskUserName(name: string): string {
  if (!name || name.length <= 2) {
    return name;
  }
  
  const firstChar = name.charAt(0);
  const lastChar = name.charAt(name.length - 1);
  const middleLength = name.length - 2;
  
  const maskedMiddle = '*'.repeat(middleLength);
  
  return `${firstChar}${maskedMiddle}${lastChar}`;
}

export function getPeriodDateFilter(period: string): { startDate?: Date; endDate?: Date } {
  const now = new Date();
  const filters: { startDate?: Date; endDate?: Date } = {};
  
  switch (period) {
    case 'WEEKLY':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      filters.startDate = weekStart;
      break;
      
    case 'MONTHLY':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filters.startDate = monthStart;
      break;
      
    case 'ALL_TIME':
    default:
      break;
  }
  
  return filters;
}

export function getCurrentPeriodIdentifier(period: string): string {
  const now = new Date();
  
  switch (period) {
    case 'WEEKLY':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
      
    case 'MONTHLY':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
    case 'ALL_TIME':
    default:
      return 'all-time';
  }
}
