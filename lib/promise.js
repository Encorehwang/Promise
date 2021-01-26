console.log('----------myPromise--------------');

const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }

  if ((typeof x === 'object' && x != null) || typeof x === 'function') {
    // 增加一个flag标识该promise对象的状态是否已经变更过了
    let called = false;
    try {
      let then = x.then;

      if (typeof then === 'function') {
        then.call(x, y => {
          // 如果状态已经变更过，直接return不做后续处理
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

  // 这个新创建的promise2就是then方法要返回的promise对象
  let promise2 = new Promise((resolve, reject) => {
    if (this.status === FULFILLED) {
      // 3.1规范 onFulfilled和onRejected被异步执行
      setTimeout(() => {
        try {
          // 2.2.7.1 规范 将onFulfilled的返回值x和promise2传入Promise Resolution Procedure方法(我们定义方法名为resolvePromise)
          let x = onFulfilled(this.value);
          resolvePromise(promise2, x, resolve, reject);
        } catch(err) {
          // 2.2.7.2规范 执行时抛出异常则promise2变为rejected状态，且该异常作为promise2的reason
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
      // 这一块是用的发布订阅模式来执行的，所以本身就不是同步执行的代码，所以可以不用setTimeout包裹
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

  // 2.2.7 返回一个新的promise对象
  return promise2;
}

Promise.prototype.catch = function _catch(onError) {
  return this.then(null, onError)
}

Promise.all = function all(promises) {
  // Promise.all方法返回的还是一个promise
  return new Promise((resolve, reject) => {
    let arr = [];
    let count = 0;

    function processData(index, value) {
      arr[index] = value;
      if (++count === promises.length) {
        // 当结果集的元素个数与传入的数组长度相等，说明所有promise都已经处理完，可以将返回的promise对象变更为fulfilled状态了
        // 且该结果集作为返回promise的value
        resolve(arr);
      }
    }
    
    for (let i=0; i<promises.length; i++) {
      let current = promises[i];
      if (isPromise(current)) {
        current.then(data => {
          processData(i, data);
        }, err => 
          reject(err) // 如果传入的参数中有任何一个promise是rejected的，直接让最终返回的promise对象变为rejected
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
	    // current是一个promise对象的话，等待其变更状态，然后将要返回的promise的状态变更为与current的状态一样即可
	    current.then(resolve, reject);
	  } else {
	    // current是普通值的话直接将要返回的promise变更为fulfilled状态，且这个普通值就是proimse的value
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