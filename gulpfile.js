var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");
var sourcemaps = require("gulp-sourcemaps");
var buffer = require("vinyl-buffer");
var uglify = require("gulp-uglify");
var ts = require("gulp-typescript");
var concat = require("gulp-concat");
var merge = require("merge2");
var del = require("del");
var replace = require("gulp-replace");

gulp.task("default", ["copy-ts", "build", "generate-definition-file"]);

gulp.task("copy-ts", ["clean"], function () {
    return gulp.src("src/**/*.ts")
        .pipe(gulp.dest("lib"));
});

gulp.task("build", ["copy-ts"], function () {
    return browserify({
        basedir: ".",
        debug: true,
        entries: ["lib/correlationVector.ts"],
        cache: {},
        standalone: 'CV',
        packageCache: {}
    })
        .plugin(tsify)
        .bundle()
        .pipe(source("index.js"))
        .pipe(gulp.dest("lib"))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist"));
});

gulp.task("generate-definition-file", ["copy-ts"], function () {
    var tsResult = gulp.src("lib/**/*.ts")
        .pipe(ts({
            declaration: true,
            declarationFiles: true,
            lib: ["es2015"],
            noImplicitAny: true,
            target: "es5"
        }));

    return merge([
        tsResult.dts
            .pipe(gulp.dest("lib"))
            .pipe(concat("index.d.ts"))
            // remove all import since we merged file together
            .pipe(replace(/^import.*[\r\n]+/mg, ""))
            .pipe(gulp.dest("lib"))
            .pipe(gulp.dest("dist")),
        tsResult.js
            .pipe(gulp.dest("lib"))
    ]);
});

gulp.task("clean", function () {
    return del([
        'dist/**/*',
        'lib/**/*',
    ]);
});