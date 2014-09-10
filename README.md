libopus.js
==========

非可逆音声符号形式である[Opus](http://opus-codec.org/)のJavaScript実装と，
Webブラウザを用いてOpusのエンコード・デコードを行うサンプルです．

TypeScriptで記述しています．


詳細
----

libopus.jsそのものは，Xiph.org Foundationによる
[Opusの実装](http://git.xiph.org/?p=opus.git)を
[Emscripten](http://emscripten.org/)を使ってコンパイルしたものです．

Webブラウザを用いてOpusのエンコード・デコードを行うサンプルでは，
ローカルに保存してあるRIFF PCM Waveファイルを再生したり，
そのファイルを利用して，エンコード速度・デコード速度を測定するほか，
エンコード結果をデコードし，その結果を再生することが出来ます．

このエンコード・デコード機能のサンプルでは，
WebWorkerを利用し別スレッドでエンコード・デコード処理を行うため，
ブラウザの他の処理に影響を与えません．
また，Opusのデコード負荷がそれほど高くないことと，
Emscriptenが出力するasm.jsは高速に動作するため，スマートフォン上でもOpusのリアルタイムでコードが可能です．

Opusは限られたサンプリングレートにしか対応しておらず，
また，WebAudioのAudioContextは環境に依存したサンプリングレートでしか動作しないため，
このサンプルではSpeexのリサンプラーを利用してサンプリングレートを合わせています．


各種バージョン
--------------

* opus: v1.1
* speexdsp: f0ec849d (Sun Aug 17 10:24:50 2014 -0700)
* emscripten: v1.23.0


ライセンス
----------

修正BSDライセンス
