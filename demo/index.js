// demo1 promise chain
let p = new Promise((resolve, reject) => {
  resolve(100);
});

let p2 = p.then(res => {
  console.log('resolve: ', res);
  return new Promise((resolve, reject) => {
    reject(200);
  });
}, err => {
  console.log('rejected: ', err);
});

p2.then().then().then().then(res => {
  console.log('p2 fulfilled: ', res);
}).catch(err => {
  console.log('p2 failed: ', err);
});

// demo2 Promise.deferred
let dfd = Promise.deferred();
setTimeout(() => {
  dfd.resolve(123);
});
dfd.promise.then(res => {
  console.log('res: ', res);
});

// demo3 Promise.all
let p3 = new Promise((resolve, reject) => {
  setTimeout(() => resolve(100), 2000);
});
let p4 = new Promise((resolve, reject) => {
  resolve(200);
});
let p5 = 300;
Promise.all([p3, p4, p5]).then(res => {
  console.log(res) // [100, 200, 300]
});

// demo4 Promise.race
// Promise.race([p3, p4, p5]).then(res => {
//   console.log(res) // 300
// });