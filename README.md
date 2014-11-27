MobileTV webapp
===

This software is complimentary to the Sysmaster's IPTV servers.

Provides means to display the list of channels and EPG information, play
channels locally (supports all major dekstop browsers, Chrome on Android and
Safari mobile on iOS 6+) and cast them (supported on Chrome for Desktop with
installed Cast extention and Android via a dedicatedly built APK based on this
source code).

##How to build

    make advanced DEBUG=false

Issue the command in the root of the project. Assumes working installtions of the [closure library][cll], the [pstj library][pstjl], the [smjs library][smjsl], [closure compiler][cc],
[soy template compiler][stc], [less compiler][lessc], [google stylesheets compiler][gssc]. For more details please refere to [this README][readme]

The following two files are designed for deplyoment:

    build/app.advanced.js
    build/app.build.css

The app support cordova out of the box, so to build for cordova simply
copy the relevant files. Note that the cast cordova extention is also required
for the casting to Chromecast to work.

__Note that this is NOT Free Software!__

**Copyright © 2001 - 2013 SysMaster Corp. All rights reserved.**

[readme]: https://github.com/pstjvn/closure-seed-project/blob/master/README.md
[cll]: https://github.com/google/closure-library/
[pstjl]: https://github.com/pstjvn/pstj-closure
[smjsl]: https://github.com/pstjvn/smjslib
[cc]: https://github.com/google/closure-compiler
[stc]: https://github.com/google/closure-templates
[lessc]: https://www.npmjs.org/package/less
[gssc]: https://github.com/google/closure-stylesheets