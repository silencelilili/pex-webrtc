'use strict';

if (window.PDFJS) {
    PDFJS.workerSrc = './js/vendor/pdf.worker.js';
    PDFJS.cMapUrl = './pdfjs/cmaps/';
    PDFJS.cMapPacked = true;
}

angular.module('pexapp')

.factory('slideShare', function($log, $timeout, $translate, toast) {
    var imageType = 'image/jpeg';
    var slideWidth = 1280;
    var slideHeight = 720;
    var slideCache = [];
    var loadingSlides = 0;

    function dataURLtoBlob(dataURL) {
        var byteString = atob(dataURL.split(',')[1]);
        // var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return ab;
    }

    function addSlide(canvas) {
        var dataURL = canvas.toDataURL(imageType);
        var blob = dataURLtoBlob(dataURL);
        var url = window.URL || window.webkitURL || window.mozURL;
        slideCache.push({
            dataURL: dataURL,
            blob: blob,
            objectURL: url.createObjectURL(new Blob([blob], {
                type: imageType
            }))
        });
    }

    var fileRenderers = {
        'image/*': function(file) {
            $timeout(function() {
                loadingSlides += 1;
            });
            var fileReader = new FileReader();
            fileReader.onerror = function() {
                $log.debug('slideShare: failed to read file: ' +
                    fileReader.error.name + ': ' + fileReader.error.message);
                $timeout(function() {
                    loadingSlides -= 1;
                });
                $translate('IDS_PRESENTATION_SLIDE_LOAD_ERROR', {
                    fileName: file.name
                }).then(function(errorMessage) {
                    toast.message(errorMessage);
                });
            };
            fileReader.onload = function() {
                var image = new Image();
                image.onload = function() {
                    var canvas = document.createElement('canvas');
                    canvas.width = slideWidth;
                    canvas.height = slideHeight;
                    var hRatio = canvas.width / image.width;
                    var vRatio = canvas.height / image.height;
                    var ratio = Math.min(hRatio, vRatio);
                    var dx = (canvas.width - image.width * ratio) / 2;
                    var dy = (canvas.height - image.height * ratio) / 2;
                    var dWidth = image.width * ratio;
                    var dHeight = image.height * ratio;
                    canvas.getContext('2d').drawImage(
                        image,
                        0, 0, image.width, image.height,
                        dx, dy, dWidth, dHeight);
                    addSlide(canvas);
                    $timeout(function() {
                        loadingSlides -= 1;
                    });
                };
                image.onerror = function(error) {
                    $log.debug('slideShare: Failed to render image:', error);
                    $timeout(function() {
                        loadingSlides -= 1;
                    });
                    $translate('IDS_PRESENTATION_SLIDE_LOAD_ERROR', {
                        fileName: file.name
                    }).then(function(errorMessage) {
                        toast.message(errorMessage);
                    });
                };
                image.src = fileReader.result;
            };
            fileReader.readAsDataURL(file);
        },

        'application/pdf': function(file) {
            $timeout(function() {
                loadingSlides += 1; //placeholder to say we are loading.
            });
            var canvas = document.createElement('canvas');
            var canvasContext = canvas.getContext('2d');
            canvas.height = slideHeight;
            var slideCanvas = document.createElement('canvas');
            slideCanvas.width = slideWidth;
            slideCanvas.height = slideHeight;
            var slideCanvasContext = slideCanvas.getContext('2d');

            var fileReader = new FileReader();
            fileReader.onerror = function() {
                $log.debug('slideShare: failed to read file: ' +
                    fileReader.error.name + ': ' + fileReader.error.message);
                $timeout(function() {
                    loadingSlides -= 1; // remove the placeholder from above
                });
            };
            fileReader.onabort = function() {
                $log.debug('FILE ABORT');
                $timeout(function() {
                    loadingSlides -= 1; // remove the placeholder from above
                });
            };
            fileReader.onload = function() {
                /* global PDFJS */
                PDFJS.getDocument({
                    data: new Uint8Array(fileReader.result)
                }).then(function(pdf) {
                    $timeout(function() {
                        loadingSlides -= 1; // remove the placeholder from above
                        loadingSlides += pdf.pdfInfo.numPages;
                    });
                    var pageIndex = 0;
                    (function renderNextPage() {
                        pageIndex = pageIndex + 1;

                        pdf.getPage(pageIndex).then(function(page) {
                            var scale = canvas.height / page.getViewport(1).height;
                            var viewport = page.getViewport(scale);
                            canvas.width = viewport.width;
                            page.render({
                                canvasContext: canvasContext,
                                viewport: viewport
                            }).then(function() {
                                var dx = (slideCanvas.width - canvas.width) / 2;
                                slideCanvasContext.drawImage(
                                    canvas,
                                    0, 0, canvas.width, canvas.height,
                                    dx, 0, canvas.width, canvas.height);
                                addSlide(slideCanvas);
                                if (loadingSlides > 0 && pageIndex < pdf.pdfInfo.numPages) {
                                    renderNextPage();
                                }
                                $timeout(function() {
                                    loadingSlides -= 1;
                                });
                            }, function(error) {
                                $log.debug('slideShare: Failed to render PDF page', pageIndex, error);
                                $timeout(function() {
                                    loadingSlides -= 1;
                                });
                            });
                        }, function(error) {
                            $log.debug('slideShare: Failed to get PDF page', pageIndex, error);
                            $timeout(function() {
                                loadingSlides -= 1;
                            });
                        });
                    })();
                }, function(error) {
                    $timeout(function() {
                        loadingSlides -= 1; // remove the placeholder from above
                    });
                    $log.info('Error loading pdf', error);
                });
            };
            fileReader.readAsArrayBuffer(file);
        }
    };

    function addSlidesFromFiles(files) {
        angular.forEach(files, function(file) {
            $log.debug('slideShare: Adding slides from file ' + file.name);
            var fileType = file.type;
            if (!fileType) {
                // If the file has no type, try to determine from file name
                var extension = /(?:\.([^.]+))?$/.exec(file.name)[1];
                fileType = {
                    'pdf': 'application/pdf'
                }[extension] || '';
            }
            if (fileType.search('image/') === 0) {
                fileType = 'image/*';
            }
            var fileRenderer = fileRenderers[fileType];
            if (fileRenderer) {
                fileRenderer(file);
            } else {
                $log.debug('slideShare: Unsupported file type:', file.name, fileType);
                $translate('IDS_PRESENTATION_SLIDE_UNSUPPORTED_FILE', {
                    fileName: file.name
                }).then(function(errorMessage) {
                    toast.message(errorMessage);
                });
            }
        });
    }

    function deleteSlide(index) {
        var slide = slideCache[index];
        if (slide) {
            var url = window.URL || window.webkitURL || window.mozURL;
            url.revokeObjectURL(slide.objectURL);
            slideCache.splice(index, 1);
        }
    }

    return {
        slides: slideCache,
        loadingSlideCount: function() {
            return loadingSlides;
        },
        resetSlideCount: function() {
            loadingSlides = 0;
        },
        addSlidesFromFiles: addSlidesFromFiles,
        deleteSlide: deleteSlide
    };
})

.directive('fileDrop', function($timeout, slideShare) {
    return {
        link: function(scope, element, attrs) {
            element.on('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });

            element.bind('drop', function(event) {
                event.preventDefault();
                event.stopPropagation();
                slideShare.addSlidesFromFiles(event.originalEvent.dataTransfer.files);
            });
        }
    };
});
