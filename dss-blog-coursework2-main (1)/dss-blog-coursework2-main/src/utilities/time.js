export function getCurrentTimeStamp() {
    return new Date(Date.now()).toISOString();
  }
  
  export function getDiff(date, mins){
    const dt = new Date(date);
    dt.setMinutes(dt.getMinutes() - mins);
    return dt.toISOString();
  }