# mimi-grep
[![Build Status](http://img.shields.io/travis/mohayonao/mimi-grep.svg?style=flat-square)](https://travis-ci.org/mohayonao/mimi-grep)
[![NPM Version](http://img.shields.io/npm/v/mimi-grep.svg?style=flat-square)](https://www.npmjs.org/package/mimi-grep)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> auralization grep command

## Installation

```
$ npm install -g mimi-grep
```

## Usage

You can choose some composer by `-c` option.

```
$ mimi-grep <filename>
$ mimi-grep -c beep <filename>
$ mimi-grep -c drone <filename>
$ mimi-grep -c drum <filename>
```

#### without node-speaker

use SoX play command (for mac user)
```
$ mimi-grep --stdout <filename> | play -t s16 -c 2 -r 44100 -
```

use ALSA aplay command (for linux user)
```
$ mimi-grep --stdout <filename> | aplay -f cd
```

## TODO

- plugin composer
- plugin parser
- stdin support

## License
MIT
