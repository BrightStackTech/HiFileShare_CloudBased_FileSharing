export const handleViewFile = (url: string, fileName?: string) => {
  const MicrosoftFileExtensions = ['.doc', '.docx', '.ppt', '.xlsx', '.pptx', '.xls', '.csv'];
  const safeFileName = (fileName || '').toLowerCase();
  const isMicrosoftFile = MicrosoftFileExtensions.some(ext => safeFileName.endsWith(ext));
  const officeViewerUrl = "https://view.officeapps.live.com/op/view.aspx?src=";
  
  if (isMicrosoftFile) {
    window.open(`${officeViewerUrl}${encodeURIComponent(url)}`, '_blank');
  } else {
    window.open(url, '_blank');
  }
};
