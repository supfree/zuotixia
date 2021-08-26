'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'zhai',
  prefix: '',
  encoding: 'utf8',
  nums_per_page: 10,
  log_sql: false,
  //log_connect: true,
  cache: {
    on: true,
    type: 'file',
    timeout: 3600
  },
  adapter: {
    zhai: {
      type:'postgresql',
      host: "127.0.0.1",
      port: "12345",
      database: "zuotixia", //数据库名称
      user: "supfree", //数据库帐号
      password: "lj19800725", //数据库密码
      prefix: "",
      encoding: "utf8",
      connectionLimit:2,
      reapIntervalMillis: 5000,
      idleTimeoutMillis:800000000
    },
  }
};