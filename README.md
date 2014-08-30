libopus.js
==========

非可逆音声符号形式である[Opus](http://opus-codec.org/)のJavaScript実装と，
Webブラウザを用いてOpusのエンコード・デコードを行うサンプルです．


詳細
----

libopus.jsそのものは，Xiph.org Foundationによる
[Opusの実装](http://git.xiph.org/?p=opus.git)を
[Emscripten](http://emscripten.org/)を使ってコンパイルしたものになります．

Webブラウザを用いてOpusのエンコード・デコードを行うサンプルでは，
ローカルに保存してあるRIFF PCM Waveファイルをエンコードしたり，
その結果をデコードすることが出来ます．
ビットレートやエンコードの進捗状況等はJavaScriptコンソールに出力されます．

このエンコード・デコード機能のサンプルでは，
WebWorkerを利用し別スレッドでエンコード・デコード処理を行うため，
ブラウザの他の処理に影響を与えません．
また，Opusのデコード負荷がそれほど高くないことと，
Emscriptenが出力するasm.jsは高速に動作するため，スマートフォン上でもOpusのリアルタイムでコードが可能です．
Webブラウザを用いたサンプルではデコードした結果をWeb Audioを利用して再生することが出来ます．


ライセンス
----------

修正BSDライセンス
