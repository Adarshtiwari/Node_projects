 async function getData() {
    return await Promise.resolve('Hello!');
  }
  
  const data = getData();
  console.log(data);