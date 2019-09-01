const { src, dest, series, parallel, watch } = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const zip = require("gulp-zip");
const merge = require("merge-stream");
const os = require("os");
const path = require("path");

const buildStyles = () => {
  console.log("Compiling CSS files...");
  sass.compiler = require("node-sass");

  const regular = src(["*.scss", "!*-cyrillic.scss"])
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(dest("dist/ursine"));

  const cyrillic = src("*-cyrillic.scss")
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(dest("dist/ursine-cyrillic"));

  return merge(regular, cyrillic);
};

const includeAssets = () => {
  const regular = src([
    "ursine/*.png",
    "ursine/Cousine-Regular.woff",
    "ursine/Adelle-*.woff",
    "ursine/AvenirNextLTPro-*.woff"
  ]).pipe(dest("dist/ursine/ursine"));

  const cyrillic = src([
    "ursine/*.png",
    "ursine/Cousine-Regular.woff",
    "ursine/AdelleCyrillic-*.woff",
    "ursine/AvenirNextCyr-*.woff"
  ]).pipe(dest("dist/ursine-cyrillic/ursine"));

  console.log("Including assets...");
  return merge(regular, cyrillic);
};

const makeZip = () => {
  const regular = src("dist/ursine/**").pipe(zip("Ursine.zip"));

  const cyrillic = src("dist/ursine-cyrillic/**").pipe(
    zip("Ursine_Cyrillic.zip")
  );

  console.log(`Building releases...`);
  return merge(regular, cyrillic).pipe(dest("./release"));
};

const dev = () => {
  let themeLocation;
  switch (os.type()) {
    case "Windows_NT":
      themeLocation = `${process.env.APPDATA}\\Typora\\themes`;
      break;
  }

  // Watch styles
  watch(
    ["*.scss", "ursine/*.scss"],
    { ignoreInitial: false },
    function styleWatcher() {
      return themeLocation
        ? buildStyles().pipe(dest(themeLocation))
        : buildStyles();
    }
  );

  // Watch assets
  watch(
    ["ursine/*.(woff|png)"],
    { ignoreInitial: false },
    function assetWatcher() {
      return themeLocation
        ? includeAssets().pipe(dest(path.join(themeLocation, "ursine")))
        : includeAssets();
    }
  );
};

exports.default = parallel(buildStyles, includeAssets);
exports.release = series(exports.default, makeZip);
exports.dev = dev;
