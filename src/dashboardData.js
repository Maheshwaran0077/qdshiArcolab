 const getStatusArray = (successCount, alertCount) => {
  const arr = Array(31).fill("none");
  let successRemaining = successCount;
  let alertsRemaining = alertCount;

   
  for (let i = 0; i < 31; i++) {
    const day = i + 1;
    const date = new Date(2026, 5, day); // 5 is June
    const dayOfWeek = date.getDay();

     if (dayOfWeek === 0 || dayOfWeek === 6) {
      arr[i] = "none"; 
      continue;
    }

    // 2. Distribute Alerts and Success 
    // This logic alternates to make the chart look realistic
    if (alertsRemaining > 0 && (i % 3 === 0 || successRemaining === 0)) {
      arr[i] = "fail"; // Red
      alertsRemaining--;
    } else if (successRemaining > 0) {
      arr[i] = "success"; // Green
      successRemaining--;
    } else if (alertsRemaining > 0) {
       arr[i] = "fail";
      alertsRemaining--;
    }
  }
  return arr;
};

export const dashboardMetrics = [
  { id: 1, label: 'SAFETY', letter: 'S', value: '14', unit: 'Days without Injuries', alerts: 4, success: 12 },
  { id: 2, label: 'QUALITY', letter: 'Q', value: '20%', unit: 'Product Defect Rate', alerts: 11, success: 9 },
  { id: 3, label: 'COST', letter: 'D', value: '5%', unit: 'Budget Adherence', alerts: 3, success: 13 },
  { id: 4, label: 'DELIVERY', letter: 'H', value: '84%', unit: 'On-Time Delivery Rate', alerts: 5, success: 11 },
  { id: 5, label: 'PEOPLE', letter: 'I', value: '6hr', unit: 'Training & Development', alerts: 4, success: 12 },
].map(metric => ({
  ...metric,
  daysData: getStatusArray(metric.success, metric.alerts),
   issueLogs: {} 
}));

export const generateMonthData = () => getStatusArray(10, 5);