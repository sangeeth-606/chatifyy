// Remove deprecated options and use current API
lockdown({
  // Remove these deprecated options:
  // dateTaming: 'safe',
  // mathTaming: 'safe',
  
  // Instead use current options if needed:
  errorTaming: 'safe',
  stackFiltering: 'verbose',
  // ...other valid options...
});
