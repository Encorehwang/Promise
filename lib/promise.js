const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }

  if ((typeof x === 'object' && x != null) || typeof x === 'function') {
    let called = false;
    try {
      let then = x.then;

      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return
          called = true;
          resolvePromise(promise2, y, resolve, reject);
        }, r => {
          if (called) return
          called = true;
          reject(r);
        })
      } else {
        resolve(x);
      }

    } catch(err) {
      if (called) return;
      
      called = true;
      reject(err);
    } 
  } else {
    resolve(x);
  }
}

function Promise(executor) {
  this.status = PENDING;
  this.value = undefined;
  this.reason = undefined;
  this.onFulfilledCallbacks = [];
  this.onRejectedCallbacks = [];

  const resolve = value => {
    if (value instanceof Promise) {
      value.then(resolve, reject);
      return;
    }

    if (this.status === 'PENDING') {
      this.value = value;
      this.status = FULFILLED;
      if (this.onFulfilledCallbacks.length) {
        this.onFulfilledCallbacks.forEach(cb => cb(this.value));
      }
    }
  };

  const reject = reason => {
    if (this.status === 'PENDING') {
      this.reason = reason;
      this.status = REJECTED;
      if (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.forEach(cb => cb(this.reason));
      }
    }
  };

  try {
    executor(resolve, reject);
  } catch(err) {
    reject(err);
  }
}

Promise.resolve = function resolve(value) {
  return new Promise(resolve => {
    resolve(value);
  });
} 
Promise.reject = function reject(reason) {
  return new Promise((_, reject) => {
    reject(reason);
  })
}

Promise.prototype.then = function then(onFulfilled, onRejected) {
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (val) => val;
  onRejected = typeof onRejected === 'function' ? onRejected : (err) => {throw err;}

  let promise2 = new Promise((resolve, reject) => {
    if (this.status === FULFILLED) {
      setTimeout(() => {
        try {
          let x = onFulfilled(this.value);
          resolvePromise(promise2, x, resolve, reject);
        } catch(err) {
          reject(err);
        }
      }, 0);
    }

    if (this.status === REJECTED) {
      setTimeout(() => {
        try {
          let x = onRejected(this.reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch(err) {
          reject(err);
        }
      }, 0);
    }

    if (this.status === PENDING) {
      this.onFulfilledCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch(err) {
            reject(err);
          }
        }, 0)
      });
      this.onRejectedCallbacks.push(() => {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch(err) {
            reject(err);
          }
        })
      });
    }
  });

  return promise2;
}

Promise.prototype.catch = function _catch(onError) {
  return this.then(null, onError)
}

Promise.all = function all(promises) {
  return new Promise((resolve, reject) => {
    let arr = [];
    let count = 0;

    function processData(index, value) {
      arr[index] = value;
      if (++count === promises.length) {
        resolve(arr);
      }
    }
    
    for (let i=0; i<promises.length; i++) {
      let current = promises[i];
      if (isPromise(current)) {
        current.then(data => {
          processData(i, data);
        }, err => 
          reject(err)
        )
      } else {
        // 是一个普通值就直接放入结果集
        processData(i, current);
      }
    }
  })
}

Promise.race = function race(promises) {
  return new Promise((resolve, reject) => {
    for (let i=0; i<promises.length; i++) {
      let current = promises[i];
	  if (isPromise(current)) {
	    current.then(resolve, reject);
	  } else {
        resolve(current);
      }
    }
  })
}

function isPromise(value) {
  if (typeof value === 'object' && value !== null || typeof value === 'function') {
    return typeof value.then === 'function';
  } else {
    return false;
  }
}

Promise.deferred = Promise.defer = function() {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}

// 下列代码仅用于promises-aplus-test跑测试流程，无须关注
if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = Promise;
}