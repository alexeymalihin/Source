'use strict';

var fs = require('fs-extra');
var extend = require('extend');
var deepExtend = require('deep-extend');
var path = require('path');
var parseHTML = require(path.join(global.pathToApp, 'core/api/parseHTML'));

var globalOpts = global.opts.core;

var flagNotExec = true;
var config = {
    // Add directory name for exclude, write path from root ( Example: ['core','docs/base'] )
    includedDirs: ['docs'],
    excludedDirs: ['data', 'plugins', 'node_modules', '.git', '.idea'],

    // File masks for search
    fileMask: ['index.html', 'index.src'],
    cron: false,
    cronProd: true,
    cronRepeatTime: 60000,
    outputFile: path.join(global.pathToApp, 'core/api/data/pages-tree.json'),
    specsRoot: path.join(global.pathToApp, globalOpts.common.pathToUser).replace(/\\/g, '/'),

    // Files from parser get info
    infoFile: "info.json"
};
// Overwriting base options
deepExtend(config, global.opts.core.fileTree);

var normalizedPathToApp = global.pathToApp.replace(/\\/g, '/');

var prepareExcludesRegex = function(){
    var dirsForRegExp = '';
    var i = 1;
    config.excludedDirs.forEach(function (exlDir) {
        if (i < config.excludedDirs.length) {
            dirsForRegExp = dirsForRegExp + "^" + config.specsRoot + "\/" + exlDir + "|";
        } else {
            dirsForRegExp = dirsForRegExp + "^" + config.specsRoot + "\/" + exlDir;
        }
        i++;
    });
    return new RegExp(dirsForRegExp);
};

var isSpec = function (file) {
    var response = false;

    config.fileMask.map(function (specFile) {
        if (file === specFile) {
            response = true;
        }
    });

    return response;
};

var fileTree = function (dir) {
    var outputJSON = {};
    var dirContent = fs.readdirSync(dir);
    var excludes = prepareExcludesRegex();

    // Adding paths to files in array
    for (var i = 0; dirContent.length > i; i++) {
        dirContent[i] = path.join(dir, dirContent[i].replace(/\\/g, '/'));
    }

    //on first call we add includedDirs
    if (dir === config.specsRoot) {
        config.includedDirs.map(function (includedDir) {
            dirContent.push(path.join(normalizedPathToApp, includedDir));
        });
    }

    dirContent.forEach(function (pathToFile) {
        // Path is excluded
        if (excludes.test(dir)) {return;}

        var targetFile = path.basename(pathToFile);
        var baseName = path.basename(dir);

        // Normalizing path for windows
        var urlToFile = path.normalize(pathToFile).replace(/\\/g, '/');

        var urlFromHostRoot = urlToFile.replace('../', '/');

        outputJSON[baseName] = outputJSON[baseName];

        var fileStats = fs.statSync(urlToFile);

        var d = new Date(fileStats.mtime);

        if (fileStats.isDirectory()) {

            var childObj = fileTree(urlToFile);
            if (Object.getOwnPropertyNames(childObj).length !== 0) {
                outputJSON[targetFile] = extend(outputJSON[targetFile], childObj);
            }

        } else if (isSpec(targetFile)) {
            var page = {};
            var urlForJson;

            // If starts with root (specs)
            if (urlFromHostRoot.lastIndexOf(config.specsRoot, 0) === 0) {
                // Cleaning path to specs root folder
                urlForJson = urlFromHostRoot.replace(config.specsRoot, '');
            } else {
                // Cleaning path for included folders
                urlForJson = urlFromHostRoot.replace(normalizedPathToApp, '');
            }

            //Removing filename from path
            urlForJson = urlForJson.split('/');
            urlForJson.pop();
            urlForJson = urlForJson.join('/');

            page.id = urlForJson.substring(1);
            page.url = urlForJson || '';
            page.lastmod = [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('.') || '';
            page.lastmodSec = Date.parse(fileStats.mtime) || '';
            page.fileName = targetFile || '';
            page.thumbnail = false;
            var infoJsonPath = dir + '/' + config.infoFile;
            if (fs.existsSync(infoJsonPath)) {
                var fileJSON;
                try {
                    fileJSON = JSON.parse(fs.readFileSync(infoJsonPath, "utf8"));
                } catch (e) {
                    console.error("Error with info.json: " + infoJsonPath);

                    fileJSON = {
                        error: "Cannot parse the file",
                        path: infoJsonPath
                    };
                }

                deepExtend(page, fileJSON);
            }

            var thumbPath = dir + '/thumbnail.png';
            if (fs.existsSync(thumbPath)) {
                // If starts with root (specs)
                if (urlFromHostRoot.lastIndexOf(config.specsRoot, 0) === 0) {
                    page.thumbnail = thumbPath.replace(config.specsRoot + '/','');
                } else {
                    page.thumbnail = thumbPath.replace(normalizedPathToApp  + '/','');
                }
            }

            outputJSON['specFile'] = extend(page);
        }
    });

    return outputJSON;
};


// function for write json file
var writeDataFile = function (callback) {
    if (flagNotExec) {
        var outputFile = config.outputFile;
        var outputPath = path.dirname(outputFile);

        flagNotExec = false;

        // Preparing path for data write
        try {
            fs.mkdirpSync(outputPath);
        } catch (e) {
            if (e.code !== 'EEXIST') {
                global.log.warn("Could not set up data directory for Pages Tree, error: ", e);

                if (typeof callback === 'function') callback(e);
            }
        }

        fs.writeFile(outputFile, JSON.stringify(fileTree(config.specsRoot), null, 4), function (err) {
            if (err) {
                console.log('Error writing file tree: ', err);
            } else {
                console.log("Pages tree JSON saved to " + outputFile);
                flagNotExec = true;
            }

            if (typeof callback === 'function') callback(err);
        });
    }
};

// Run function on server start
writeDataFile(function(){
    if (global.opts.core.parseHTML.onStart) parseHTML.processSpecs();
});

// Running writeDataFile by cron
if (config.cron || (global.MODE === 'production' && config.cronProd)) {
    setInterval(function () {
        writeDataFile();
    }, config.cronRepeatTime);
}

// run task from server homepage
module.exports.scan = function () {
    // flag for waiting script end and only then can be run again
    writeDataFile();
};