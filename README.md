# lemon-chrome-bot

chrome extension to communicate between websocket <-> background <-> tabs <-> content <-> page.


## Dev Environ (개발 환경)

1. Open Chrome browser with url `chrome://extensions`.
1. Activate `Developer mode` --> Select `LOAD UNPACKED` --> Select `build` folder. (NOTE! run `npm run build` before)
1. Open development console --> Reload Page --> Check `lemon ready!` message in console log.


## Background Console (백그라운드 디버깅)

1. `chrome://extensions` -> Select "Lemon Chrome Bot" -> Inspect views `background page`.

- page 의 `document.location`를 얻는 방법

```js
// set default tab-id as 2 (maybe 2nd tab)
> $LEM.tid=2   
> $LEM.eval('document.location')
```


-----------------
# React App

- 관리 화면을 react로 만듬. 참고 [url](https://medium.com/@gilfink/building-a-chrome-extension-using-react-c5bfe45aaf36)

```bash
$ npm install -g create-react-app
$ create-react-app my-extension
# copy all files in my-extension to ./
$ npm run build
```


-----------------
# References

- [매진된 SRT 승차권 예매를 도와주는 크롬 확장 프로그램](https://github.com/meeeejin/srtmacro)
- [Publish Chrome Extension](https://medium.freecodecamp.org/how-to-create-and-publish-a-chrome-extension-in-20-minutes-6dc8395d7153)
- [Socket Io in chrome](https://stackoverflow.com/questions/18178491/socket-io-in-chrome-extension)
- [Using Messaging](https://medium.com/@gilfink/using-messaging-in-chrome-extension-4ae65c0622f6)
