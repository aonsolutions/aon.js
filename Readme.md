# tEDI

## Install
```sh
$	npm install tedi
```
## Introduction

Here is an example on how to use it:
```js
	var tedi	= require('tedi');
```
## Contributors
Thanks goes to the people who have contributed code to this module, see the [GitHub Contributors page][].

[GitHub Contributors page]:https://github.com/aonsolutions/aon.js/graphs/contributors

## Running tests

The  tests require a MySQL server instance to be setup.

Set the environment variables `MYSQL_DATABASE`, `MYSQL_HOST`, `MYSQL_PORT`,
`MYSQL_USER` and `MYSQL_PASSWORD`. `MYSQL_SOCKET` can also be used in place
of `MYSQL_HOST` and `MYSQL_PORT` to connect over a UNIX socket. Then run
`npm test`.

For example, if you have an installation of mysql running on localhost:3306
and no password set for the `root` user, run:

```sh
$ mysql -u root -e "CREATE DATABASE IF NOT EXISTS tedi_test"
$ MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_DATABASE=tedi_test MYSQL_USER=root MYSQL_PASSWORD= npm test
```
