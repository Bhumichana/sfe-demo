import type { ExecutiveDashboardData } from '@/mocks/analytics-mock';

/**
 * Export dashboard to PDF
 */
export const exportToPDF = async (elementId: string, filename: string = 'executive-dashboard.pdf') => {
  try {
    // Dynamically import libraries to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    loadingToast.textContent = 'Generating PDF...';
    document.body.appendChild(loadingToast);

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(filename);

    // Remove loading indicator
    document.body.removeChild(loadingToast);

    // Show success toast
    showToast('PDF exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    showToast('Failed to export PDF', 'error');
  }
};

/**
 * Export dashboard data to Excel
 */
export const exportToExcel = async (data: ExecutiveDashboardData, filename: string = 'executive-dashboard.xlsx') => {
  try {
    // Dynamically import XLSX to avoid SSR issues
    const XLSX = await import('xlsx');

    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    loadingToast.textContent = 'Generating Excel...';
    document.body.appendChild(loadingToast);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Sales Funnel
    const salesFunnelData = data.salesFunnel.funnel.map(item => ({
      'Stage': item.stage,
      'Count': item.count,
      'Percentage': `${item.percentage}%`,
    }));
    const ws1 = XLSX.utils.json_to_sheet(salesFunnelData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Sales Funnel');

    // Sheet 2: Territory Comparison
    const territoryData = data.territoryComparison.territories.map(t => ({
      'Territory Code': t.territoryCode,
      'Territory Name': t.territoryName,
      'Total Calls': t.totalCalls,
      'Team Size': t.teamSize,
      'Avg Calls per SR': t.avgCallsPerSR.toFixed(1),
      'ABC Coverage': `${t.abcCoverage.toFixed(1)}%`,
    }));
    const ws2 = XLSX.utils.json_to_sheet(territoryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Territory Comparison');

    // Sheet 3: Customer Segmentation
    const segmentData = data.customerSegmentation.abcDistribution.map(s => ({
      'Type': s.type,
      'Count': s.count,
      'Percentage': `${s.percentage.toFixed(1)}%`,
    }));
    const ws3 = XLSX.utils.json_to_sheet(segmentData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Customer Segmentation');

    // Sheet 4: Trend Analysis
    const trendData = [
      ...data.trendAnalysis.historical.map(t => ({
        'Month': t.month,
        'Count': t.count,
        'Type': 'Historical',
        'Growth Rate': t.growthRate ? `${t.growthRate.toFixed(1)}%` : '-',
      })),
      ...data.trendAnalysis.forecast.map(t => ({
        'Month': t.month,
        'Count': t.count,
        'Type': 'Forecast',
        'Growth Rate': '-',
      })),
    ];
    const ws4 = XLSX.utils.json_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Trend Analysis');

    // Sheet 5: Performance Heatmap
    if (data.performanceHeatmap && data.performanceHeatmap.heatmapData) {
      const heatmapData: any[] = [];
      data.performanceHeatmap.heatmapData.forEach(dayData => {
        data.performanceHeatmap.territoryList.forEach(territory => {
          heatmapData.push({
            'Day': dayData.day,
            'Territory': territory,
            'Calls': dayData.territories[territory] || 0,
          });
        });
      });
      const ws5 = XLSX.utils.json_to_sheet(heatmapData);
      XLSX.utils.book_append_sheet(wb, ws5, 'Performance Heatmap');
    }

    // Sheet 6: Team Radar Comparison
    if (data.teamRadar && data.teamRadar.radarData) {
      const radarData: any[] = [];
      data.teamRadar.radarData.forEach(metric => {
        const row: any = { 'Metric': metric.metric };
        data.teamRadar.teams.forEach(team => {
          row[team] = metric[team];
        });
        radarData.push(row);
      });
      const ws6 = XLSX.utils.json_to_sheet(radarData);
      XLSX.utils.book_append_sheet(wb, ws6, 'Team Comparison');
    }

    // Save file
    XLSX.writeFile(wb, filename);

    // Remove loading indicator
    document.body.removeChild(loadingToast);

    // Show success toast
    showToast('Excel exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showToast('Failed to export Excel', 'error');
  }
};

/**
 * Show toast notification
 */
const showToast = (message: string, type: 'success' | 'error') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};
