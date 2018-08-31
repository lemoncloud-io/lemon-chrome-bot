# lemon-chrome-bot

chrome extension for lemon-bot.


## 개발 환경

1. 크롬 브라우저 에서 `chrome://extensions`을 연다.
1. `Developer mode`를 활성화 시키고 --> `LOAD UNPACKED`를 선택하고 --> 이 프로젝트의 `build` 폴더를 선택. (주의! react 빌드 후)
1. 개발자 콘솔 창을 열고 --> 페이지 릴로드 해보면 --> `lemon ready!`가 출력 되면 정상.


## 백그라운드 디버깅

1. `chrome://extensions` -> Select "Lemon Chrome Bot" -> Inspect views `background page`.


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
