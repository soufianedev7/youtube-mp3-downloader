(function ($) {
    /* jshint strict: false */
    /* global Cookies, addthis, YT */
    $(function () {
        // Define some functions
        if (typeof window._lib !== 'object') {
            window._lib = {};
        }
        var library = window._lib;
        library.getQuery = function () {
            // Get search term from cookies
            var searchTerm = Cookies.get('searchTerm');
            searchTerm = typeof searchTerm === 'string' ? decodeURIComponent(searchTerm) : '';
            // Get latest Query from URL
            var latestQuery = decodeURIComponent(window.location.pathname.match(/[^\/]*$/)[0]);
            // Dump final query
            return library.safeString(searchTerm) === library.safeString(latestQuery) ? searchTerm : latestQuery;
        };
        library.safeString = function (string) {
            return typeof string === 'string' ?
                string.replace(/[~`!@#\$%\^&\*\(\)\-_\+=\{\[}\]\\\|:;"'<,>\.\?\/\s]+/g, '-')
                    .replace(/^\-+/, '').replace(/\-+$/, '') : '';
        };
        library.setTitle = function (string, values) {
            var pageTitle = window.siteConf.siteName;
            if (typeof string === 'string' && typeof values === 'object') {
                pageTitle = string;
                for (var key in values) {
                    if (values.hasOwnProperty(key)) {
                        pageTitle = pageTitle.replace(new RegExp(key, "g"), values[key]);
                    }
                }
            }
            // Set webpage title
            window.document.title = pageTitle.substr(0, 1).toUpperCase() + pageTitle.substr(1);
        };
        library.setQuery = function (query, direct) {
            rsParent.removeClass('show-me');
            // Validate input
            if (typeof query === 'string') {
                // Update search term
                if (!direct) {
                    Cookies.set('searchTerm', encodeURIComponent(query));
                }
                // Prepare target
                var target, charts;
                if ((charts = query.match(/^@Charts=(.+)/i)) instanceof Array) {
                    target = '@Charts=' + library.safeString(charts[1]);
                } else if (query.match(/^@(Charts|Favorites)$/i)) {
                    target = query;
                } else if (query === '@Search') {
                    var lastSearch = localStorage.getItem('lastSearch');
                    if (typeof lastSearch === 'string') {
                        var M;
                        if ((M = lastSearch.match(/(.*)\(([a-z0-9\-\_]{11})\)$/i)) instanceof Array) {
                            target = library.safeString(M[1]) + '(' + M[2] + ')';
                        } else {
                            target = library.safeString(lastSearch);
                        }
                    } else {
                        target = library.safeString('3D video');
                    }
                } else {
                    target = typeof direct !== 'undefined' && direct ? query : library.safeString(query);
                }
                target = window.siteConf.siteLink + target;
                // Open target
                if (window.siteConf.instantMode && 'pushState' in history && window.appPage) {
                    history.pushState(null, null, target);
                    library.videos.grab();
                } else {
                    window.location.href = target;
                }
            }
        };
        library.downloadAs = function (link, name, inPage) {
            if (typeof link === 'string' && typeof name === 'string') {
                // Prepare temporary download element
                var dl = document.createElement('a');
                // Prepare download link
                if (typeof inPage === 'boolean' && inPage) {
                    dl.setAttribute('download', name);
                }
                dl.setAttribute('href', link);
                dl.setAttribute('target', '_blank');
                dl.setAttribute('style', 'position:absolute;visibility:hidden;top:-9999px;left:-9999px');
                // Append download link to page
                document.body.appendChild(dl);
                dl.innerText = 'Download';
                // Click on download link
                dl.click();
                // Remove download link from page
                dl.remove();
            }
        };
        library.asciiHEX = function (string) {
            var ret = '';
            if (typeof string === 'string') {
                for (var i = 0; i < string.length; i++) {
                    var char = string.charCodeAt(i).toString(16);
                    ret += char.length === 1 ? ('0' + char) : char;
                }
            }
            return ret.toUpperCase();
        };
        library.SmartNum = function (number, Simple) {
            var OUT = '';
            if (typeof Simple === 'boolean' && Simple) {
                OUT = number >= 1e3 ?
                    (number >= 1e6 ?
                        (number >= 1e9 ?
                        ((number / 1e9).toFixed(1)) + ' B+'
                            : ((number / 1e6).toFixed(1)) + ' M+')
                        : ((number / 1e3).toFixed(1)) + ' K+')
                    : number + '';
            } else {
                OUT = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            return OUT;
        };
        library.HumanTime = function (time) {
            var $return = '';
            // Optimize time value
            time = parseFloat(time);
            time = time > 0 ? time : 0;
            // Get seconds
            var secs = parseInt(time, 10);
            secs = isNaN(secs) ? 0 : secs;
            // Calculate units
            var H = Math.floor(secs / 3600),
                M = Math.floor(secs / 60) % 60,
                S = secs % 60;
            // Update time
            $return += H > 0 ? ((H < 10 ? '0' + H : H) + ':') : '';
            $return += M > 0 ? ((M < 10 ? '0' + M : M) + ':') : '00:';
            $return += S > 0 ? ((S < 10 ? '0' + S : S)) : '00';

            return $return;
        };
        library.HumanBytes = function (number, plus24, uppercase) {
            var output = '0 ';
            // Validate number
            if (typeof number === 'number' && number >= 0) {
                // Optimize arguments
                plus24 = typeof plus24 === 'undefined' ? true : plus24;
                uppercase = typeof uppercase === 'undefined' ? true : uppercase;
                var num = number;
                // Binary data measurement units
                var bunits = plus24 ?
                {'B': 1, 'K': 1024, 'M': 1048576, 'G': 1073741824}
                    : {'B': 1, 'K': 1000, 'M': 1000000, 'G': 1000000000};
                // Get human friendly binary unit
                var bunit = num < bunits.K ? 'B' : (num < bunits.M ? 'K' : (num < bunits.G ? 'M' : 'G'));
                // Calculate binary size
                num = (num / bunits[bunit]) + 0.000001;
                num = num >= 10 ?
                    (num >= 100 ?
                        (num > 1000 ?
                            Math.round(num).toString()
                            : ' ' + Math.round(num).toString())
                        : num.toString().match(new RegExp('^[0-9]*\\.[0-9]'))[0])
                    : num.toString().match(new RegExp('^[0-9]*\\.[0-9]{2}'))[0];
                output = num + (bunit !== "B" ? (" " + bunit) : ' ');
                output = uppercase ? output.toUpperCase() : output.toLowerCase();
            }
            return output;
        };
        library.latestSearches = function (query) {
            rsParent.removeClass('show-me');
            // Latest Searches
            $.ajax({
                url: './ajax',
                type: 'POST',
                data: {purpose: 'latestSearches', search: query},
                dataType: 'json'
            }).always(function (response, status) {
                if (status === 'success' && typeof response === 'object' && response !== null) {
                    if (typeof response.latest === 'object') {
                        // Prepare list
                        var list = $('<ul>');
                        for (var i in response.latest) {
                            if (response.latest.hasOwnProperty(i)) {
                                var term = response.latest[i];
                                term = term.substr(0, 1).toUpperCase() + term.substr(1);
                                list.append($('<li>').html($('<a>')
                                    .attr({href: window.siteConf.siteLink + library.safeString(term), title: term})
                                    .text(term)));
                            }
                        }
                        // Update search list
                        $('#lsParent').html($('<div>').attr({id: 'latestSearches', class: 'contentBox'})
                            .append($('<div>').addClass('cbHead').text('Latest Searches'))
                            .append($('<div>').addClass('cbBody').html(list)));
                    }
                }
            });
            // Related searches
            $.ajax({
                url: 'http://api.bing.com/osjson.aspx?query=' + query + '&JsonType=callback&JsonCallback=?',
                dataType: 'jsonp'
            }).always(function (response, status) {
                if (status == 'success' && typeof response == 'object' && response != null &&
                    response instanceof Array && typeof response[1] == 'object' && response[1] instanceof Array &&
                    response[1].length > 0) {
                    // Display related searches
                    rsParent.addClass('show-me');
                    // Prepare list
                    var list = $('<ul>');
                    for (var i in response[1]) {
                        if (response[1].hasOwnProperty(i)) {
                            var term = response[1][i];
                            term = term.substr(0, 1).toUpperCase() + term.substr(1);
                            list.append($('<li>').html($('<a>')
                                .attr({href: window.siteConf.siteLink + library.safeString(term), title: term})
                                .text(term)));
                        }
                    }
                    // Update search list
                    rsParent.html($('<div>').attr({id: 'relatedSearches', class: 'contentBox'})
                        .append($('<div>').addClass('cbHead').text('Related Searches'))
                        .append($('<div>').addClass('cbBody').html(list)));
                }
            });
        };
        library.loadCharts = function (callback) {
            if (typeof callback === 'function') {
                $.ajax({
                    url: './ajax',
                    type: 'POST',
                    data: {purpose: 'getCharts'},
                    dataType: 'json'
                }).always(function (response, status) {
                    if (status === 'success' && typeof response === 'object' && response !== null) {
                        // Prepare output data
                        var output = {}, outputOK = false;
                        // Scan IDs
                        for (var continent in response.charts.countries) {
                            if (response.charts.countries.hasOwnProperty(continent)) {
                                var countries = response.charts.countries[continent];
                                for (var country in countries) {
                                    if (countries.hasOwnProperty(country)) {
                                        var countryName = countries[country];
                                        if (country.toLowerCase() in response.charts.list) {
                                            var videoIDs = response.charts.list[country.toLowerCase()].match(/.{11}/g);
                                            if (videoIDs instanceof Array) {
                                                outputOK = true;
                                                // Update output data
                                                if (typeof output[continent] !== 'object') {
                                                    output[continent] = {};
                                                }
                                                output[continent][country] = {
                                                    name: countryName,
                                                    list: videoIDs
                                                };
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // Check final output
                        callback(outputOK ? output : false);
                    } else {
                        callback(false);
                    }
                });
            }
        };
        library.fevorites = {
            getFevorites: function (except) {
                return library.videos.filter(localStorage.getItem('myFevorites'), except);
            },
            toggleFevorite: function (video) {
                var ret = false;
                if (typeof video === 'string' && video.length === 11) {
                    // Get total my fevorites
                    var myFevorites = library.fevorites.getFevorites();
                    // Find video on fevorites
                    var myPos = myFevorites.indexOf(video);
                    // Check status
                    if (myPos > -1) {
                        ret = 'del';
                        // Remove
                        delete  myFevorites[myPos];
                        // Update storage
                        localStorage.setItem('myFevorites', myFevorites.join(''));
                    } else {
                        ret = 'add';
                        // Add
                        myFevorites.push(video);
                        // Update storage
                        localStorage.setItem('myFevorites', myFevorites.join(''));
                    }
                }
                return ret;
            }
        };
        library.videos = {
            filter: function (total, except) {
                var output = [];
                // Validate input params
                if (typeof total === 'string') {
                    except = typeof except === 'string' ? except : '';
                    // Decode video IDs
                    var totalVideos = total.match(/.{11}/g),
                        exceptVideos = except.match(/.{11}/g);
                    totalVideos = totalVideos instanceof Array ? totalVideos : [];
                    exceptVideos = exceptVideos instanceof Array ? exceptVideos : [];
                    // Get final videos
                    if (exceptVideos.length > 0) {
                        for (var i = 0; i < totalVideos.length; i++) {
                            if (exceptVideos.indexOf(totalVideos[i]) === -1) {
                                output.push(totalVideos[i]);
                            }
                        }
                    } else {
                        output = totalVideos;
                    }
                }
                return output;
            },
            build: function (elm, info, favorite) {
                if (elm.length > 0 && typeof info === 'object') {
                    // Build video rating stars
                    var Stars = $('<div>'), FullStars = Math.floor(info.stats.rating), S;
                    for (S = 1; S <= FullStars; S++) {
                        Stars.append($('<span>').addClass('fa fa-star'));
                    }
                    if (FullStars !== info.stats.rating) {
                        Stars.append($('<span>').addClass('fa fa-star-half-o'));
                    }
                    for (S = 1; S <= (5 - Math.ceil(info.stats.rating)); S++) {
                        Stars.append($('<span>').addClass('fa fa-star-o'));
                    }
                    // Build video information layout
                    elm.addClass('video').attr({
                        'data-vid': info.id,
                        'data-vuser': info.publish.user,
                        'data-vowner': info.publish.owner,
                        'data-vtoken': info.token,
                        'data-vtitle': info.title,
                        'data-mp3size': library.HumanBytes(info.duration * (320 / 8) * 1000, true, true) + 'B'
                    });
                    // Display special features of video
                    if (info.features.HD) {
                        elm.addClass('hd-video');
                        elm.append($('<span>').addClass('ribbon orange video-hd').text('HD'));
                    }
                    if (info.features['3D']) {
                        elm.append($('<span>').addClass('ribbon green video-3d').text('3D'));
                    }
                    // Video header
                    elm.append($('<div>').addClass('v-head')
                        .html($('<span>').addClass('v-open').attr('title', info.title).text(info.title)));
                    // Video body
                    elm.append($('<div>').addClass('v-body')
                        // Video thumbnail
                        .append($('<div>').addClass('v-thumb').css('background-image', 'url(\'' + info.thumbnail + '\')')
                            // Videp dim effect
                            .append($('<div>').addClass('v-pack'))
                            // Video play
                            .append($('<div>').addClass('v-play').html($('<span>').addClass('fa fa-play')))
                            // Video duration
                            .append($('<div>').addClass('v-duration').text(library.HumanTime(info.duration))))
                        // Video details
                        .append($('<div>').addClass('v-details')
                            // Video title
                            .append($('<div>').addClass('v-title')
                                .html($('<span>').addClass('v-open').attr('title', info.title).text(info.title)))
                            // Video owner and release date
                            .append($('<div>').addClass('v-born')
                                .append('by&nbsp;')
                                .append($('<span>').addClass('v-owner').text(info.publish.owner))
                                .append($('<span>').addClass('v-date').append('&nbsp;on&nbsp;')
                                    .append($('<span>').addClass('v-release').text(info.publish.date))))
                            // Video stats
                            .append($('<div>').addClass('v-stats').html($('<ul>')
                                    .append($('<li>').addClass('v-views')
                                        .append($('<span>').addClass('fa fa-area-chart'))
                                        .append($('<span>').addClass('vs-large').text(library.SmartNum(info.stats.views, false)))
                                        .append($('<span>').addClass('vs-small').text(library.SmartNum(info.stats.views, true))))
                                    .append($('<li>').addClass('v-likes')
                                        .append($('<span>').addClass('fa fa-thumbs-o-up'))
                                        .append($('<span>').addClass('vs-large').text(library.SmartNum(info.stats.likes, false)))
                                        .append($('<span>').addClass('vs-small').text(library.SmartNum(info.stats.likes, true))))
                                    .append($('<li>').addClass('v-dislikes')
                                        .append($('<span>').addClass('fa fa-thumbs-o-down'))
                                        .append($('<span>').addClass('vs-large').text(library.SmartNum(info.stats.dislikes, false)))
                                        .append($('<span>').addClass('vs-small').text(library.SmartNum(info.stats.dislikes, true))))
                            ))
                            // VIdeo rating
                            .append($('<div>').addClass('v-rating')
                                .append($('<span>').addClass('v-stars').html(Stars.html()))
                                .append($('<span>').addClass('v-rate-by')
                                    .append('&nbsp;by&nbsp;')
                                    .append($('<span>').addClass('v-rate-large')
                                        .text(library.SmartNum(info.stats.likes + info.stats.dislikes, false)))
                                    .append($('<span>').addClass('v-rate-small')
                                        .text(library.SmartNum(info.stats.likes + info.stats.dislikes, true)))
                                    .append('&nbsp;users')))));
                    // Add video footer
                    elm.append($('<div>').addClass('v-foot')
                            .append($('<ul>').addClass('v-engage')
                                .append($('<li>').html($('<span>')
                                    .attr('title', 'Add to favorites')
                                    .addClass('video-fav fa fa-heart' + (favorite ? '' : '-o'))))
                                .append(typeof window.siteConf.addthisShare === 'boolean' && window.siteConf.addthisShare ?
                                    $('<li>').html($('<span>').attr('title', 'Share this video').addClass('video-share fa fa-share-alt'))
                                    : '')
                                .append(typeof window.siteConf.musicPlayer === 'boolean' && window.siteConf.musicPlayer ?
                                    $('<li>').html($('<span>').attr('title', 'Play music').addClass('video-mplay fa fa-youtube-play'))
                                    : ''))
                            .append($('<ul>').addClass('v-actions')
                                .append($('<li>').addClass('v-dl-mp3').append($('<span>').text('Download ')).append(
                                    window.siteConf.useFFmpeg ? 'MP3' :
                                        ('MP3 - ' + (library.HumanBytes(info.duration * 8000, true, true) + 'B'))))
                                .append($('<li>').addClass('v-dl-more').append($('<span>').text('Download ')).append('MP4')))
                    );
                    // Add MP3 download panel
                    var vdlUL = $('<ul>'), bitRates = [320, 256, 192, 128, 64];
                    for (var i in bitRates) {
                        if (bitRates.hasOwnProperty(i)) {
                            // Get media data and element
                            var bitRate = bitRates[i], mediaDOM = $('<li>');
                            // Update configuration
                            mediaDOM.addClass('media-parent').attr('data-mp3-bitrate', bitRate);
                            // Update content
                            mediaDOM.html($('<div>')
                                .addClass('media-block media-type-mp3 media-type-mp3-' + bitRate)
                                .append($('<div>').addClass('media-eq')
                                    .append($('<div>').addClass('media-ext').text('MP3'))
                                    .append($('<div>').addClass('media-qlt').text(bitRate + 'kbps')))
                                .append($('<div>').addClass('media-sz').text(
                                    library.HumanBytes(info.duration * (bitRate / 8) * 1000, true, true) + 'B'
                                )));
                            // Update buttons
                            vdlUL.append(mediaDOM);
                        }
                    }
                    elm.append($('<div>').addClass('v-music')
                        .append($('<div>').addClass('media-load')
                            .append($('<div>').addClass('load-icon').html(loadIcon.html()))
                            .append($('<span>').html('Please wait preparing high quality MP3 for you')))
                        .append($('<div>').addClass('media-fail').text('Failed to prepare MP3'))
                        .append($('<div>').addClass('media-items').html(vdlUL)));
                    // Add video download intial panel
                    elm.append($('<div>').addClass('v-download')
                        .append($('<div>').addClass('media-load')
                            .append($('<div>').addClass('load-icon').html(loadIcon.html()))
                            .append($('<span>').html('Please wait loading downloadable HD videos')))
                        .append($('<div>').addClass('media-fail').text('Failed to load videos list'))
                        .append($('<div>').addClass('media-view')
                            .append($('<ul>').addClass('media-filter')
                                .append($('<li>').attr('data-filter-type', 'normal-videos').text('Videos'))
                                .append($('<li>').attr('data-filter-type', 'video-streams')
                                    .append($('<span>').addClass('text-large').text('Video Streams'))
                                    .append($('<span>').addClass('text-small')
                                        .append('Videos')
                                        .append($('<span>').addClass('fa fa-bell-slash'))))
                                .append($('<li>').attr('data-filter-type', 'audio-streams')
                                    .append($('<span>').addClass('text-large').text('Audio Streams'))
                                    .append($('<span>').addClass('text-small').append('Audios'))))
                            .append($('<ul>').addClass('media-sort')
                                .append($('<li>').attr('data-sort-type', 'extension').text('Extension'))
                                .append($('<li>').attr('data-sort-type', 'quality').text('Quality'))
                                .append($('<li>').attr('data-sort-type', 'size').text('Size')))
                            .append($('<div>').css({
                                position: 'relative',
                                clear: 'both'
                            })))
                        .append($('<div>').addClass('media-items'))
                        .append(window.siteConf.directDownload ? ($('<div>')
                            .addClass('media-speed high-speed-yes')
                            .append($('<div>').addClass('ms-option')
                                .append($('<span>').addClass('mso-icon fa fa-square-o'))
                                .append($('<span>').addClass('mso-icon fa fa-check-square-o'))
                                .append($('<span>').addClass('mso-label').text('High speed download')))
                            .append($('<div>').addClass('ms-info').append(hsdTXT))) : ''));
                }
            },
            ajax: function (query, noExtra, callback) {
                if (typeof query === 'string' && typeof callback === 'function') {
                    // Prepare ajax request
                    var request = {query: query, purpose: 'search'};
                    // Don't search extra videos
                    if (noExtra) {
                        request.noExtra = 'yes';
                    }
                    // Send ajax request
                    $.ajax({
                        url: './ajax',
                        type: 'POST',
                        data: request,
                        dataType: 'json'
                    }).always(function (response, status) {
                        if (status === 'success') {
                            if (typeof response === 'object' && response !== null) {
                                if (typeof response.status === 'boolean' && response.status) {
                                    callback(response);
                                } else if ('error' in response) {
                                    callback(response.error);
                                } else {
                                    callback('Unknown error...');
                                }
                            } else {
                                callback('Invalid data received from server');
                            }
                        } else {
                            callback('Failed to connect website server');
                        }
                    });
                }
            },
            display: function (query, noExtra, loadMore, loadMoreConfig, callback) {
                library.videos.ajax(query, noExtra, function (result) {
                    if (typeof result === 'object') {
                        // Update load more configuration
                        if (typeof result.directAction === 'string') {
                            window.loadMore = {type: 'search', query: result.directAction};
                        } else if (typeof loadMoreConfig === 'object') {
                            window.loadMore = loadMoreConfig;
                        } else {
                            window.loadMore = false;
                        }
                        // Display videos list
                        load.removeClass('load-show');
                        var myFavs = library.fevorites.getFevorites();
                        for (var i in result.videos) {
                            if (result.videos.hasOwnProperty(i)) {
                                var elm = $('<div>'), info = result.videos[i];
                                library.videos.build(elm, info, myFavs.indexOf(info.id) > -1);
                                videos.append(elm);
                            }
                        }
                        // Display load more button
                        if (loadMore || typeof result.directAction === 'string') {
                            lMore.addClass('show-me');
                        } else {
                            lMore.removeClass('show-me');
                        }
                    } else {
                        load.addClass('load-error').find('span').text(result);
                    }
                    if (typeof callback === 'function') {
                        callback(result);
                    }
                });
            },
            search: function (query) {
                // Update last search value
                localStorage.setItem('lastSearch', query);
                // Update layouts
                videosMenu.find('[data-video-panel]').removeClass('active');
                videosArea.find('[data-video-panel]').removeClass('active');
                videosMenu.find('[data-video-panel="search"]').addClass('active');
                videosArea.find('[data-video-panel="search"]').addClass('active');
                // Searching videos
                library.setTitle('Searching videos... | {{site-name}}', {'{{site-name}}': window.siteConf.siteName});
                // Start searching
                library.videos.display(query, undefined, undefined, undefined, function (result) {
                    if (typeof result === 'object') {
                        var isVideo = false, isChannel = false;
                        for (var i in result.videos) {
                            if (result.videos.hasOwnProperty(i)) {
                                var video = result.videos[i];
                                if (query.indexOf(video.id) > -1) {
                                    isVideo = video;
                                }
                                if (query.indexOf(video.publish.user) > -1) {
                                    isChannel = video;
                                }
                            }
                        }
                        // Prepare title
                        if (isVideo !== false) {
                            // Update title
                            library.setTitle(window.siteTitles.video, {
                                '{{site-name}}': window.siteConf.siteName,
                                '{{video-id}}': isVideo.id,
                                '{{video-title}}': isVideo.title,
                                '{{video-description}}': isVideo.title,
                                '{{video-duration}}': isVideo.duration,
                                '{{video-time}}': library.HumanTime(isVideo.duration),
                                '{{video-date}}': isVideo.publish.date,
                                '{{video-owner}}': isVideo.publish.owner,
                                '{{mp3-size}}': library.HumanBytes(isVideo.duration * (320 / 8) * 1000, true, true) + 'B'
                            });
                        } else if (isChannel !== false) {
                            // Update title
                            library.setTitle(window.siteTitles.search, {
                                '{{search}}': isChannel.publish.owner,
                                '{{site-name}}': window.siteConf.siteName
                            });
                        } else {
                            // Update title
                            library.setTitle(window.siteTitles.search, {
                                '{{search}}': query.replace(/\-/g, ' '),
                                '{{site-name}}': window.siteConf.siteName
                            });
                            // Process latest searches
                            library.latestSearches(query.replace(/\-/g, ' '));
                        }
                    } else {
                        library.setTitle('Failed to load videos | {{site-name}}', {'{{site-name}}': window.siteConf.siteName});
                    }
                });
            },
            grab: function () {
                var query = library.getQuery(), matches;
                // Show load messages
                load
                    .removeClass('load-error').addClass('load-show')
                    .find('span').text('Please wait, loading videos...');
                lMore.removeClass('show-me');
                // Reset videos list
                videos.html('');
                // Update search value
                var M;
                if ((M = query.match(/(.*)\(([a-z0-9\-]+)\)$/i)) instanceof Array) {
                    sin.val(M[1].replace(/\-/g, ' ') + '(' + M[2] + ')');
                } else {
                    sin.val(query.replace(/\-/g, ' '));
                }
                // Define default query
                query = query.length === 0 ? '@Charts' : query;
                // Check for is special query
                if (query.substr(0, 1) === '@') {
                    // Validate special queries
                    var loadVideos, loadMore;
                    if ((matches = query.match(/^@Charts=?(.*)/i)) instanceof Array) {
                        // Update layouts
                        videosMenu.find('[data-video-panel]').removeClass('active');
                        videosArea.find('[data-video-panel]').removeClass('active');
                        videosMenu.find('[data-video-panel="charts"]').addClass('active');
                        videosArea.find('[data-video-panel="charts"]').addClass('active');
                        // Get country from link
                        var chartCountry, chartValue = matches[1].trim(), cV = chartValue.toUpperCase();
                        if (chartValue.length > 0) {
                            for (var cCode in window.countries) {
                                if (window.countries.hasOwnProperty(cCode)) {
                                    var cName = window.countries[cCode];
                                    // Search on countries
                                    if (cV === cCode || cV === cName.toUpperCase()) {
                                        chartCountry = cCode;
                                        break;
                                    }
                                }
                            }
                        }
                        // Get country from cache
                        if (typeof chartCountry !== 'string') {
                            var lsCountry = localStorage.getItem('chartCountryCode');
                            if (window.countryCodes.indexOf(lsCountry) > -1) {
                                chartCountry = lsCountry;
                            }
                        }
                        // Get country from IP address
                        if (typeof chartCountry !== 'string' && window.siteConf.detectCountry &&
                            typeof window.visitorCountry === 'string' &&
                            window.countryCodes.indexOf(window.visitorCountry) > -1) {
                            chartCountry = window.visitorCountry;
                        }
                        // Get country from default config
                        if (typeof chartCountry !== 'string') {
                            var defaultChart = $('body').attr('data-default-chart');
                            if (window.countryCodes.indexOf(defaultChart) > -1) {
                                chartCountry = defaultChart;
                            }
                        }
                        // All above steps are failed. So, set country as "US".
                        if (typeof chartCountry !== 'string') {
                            chartCountry = 'US';
                        }
                        // Update page details
                        library.setTitle(window.siteTitles.charts, {
                            '{{site-name}}': window.siteConf.siteName,
                            '{{chart-code}}': chartCountry,
                            '{{chart-name}}': window.countries[chartCountry]
                        });
                        // Display country name on screen
                        $('#chooseCountry').find('.countryName').text(window.countries[chartCountry]);
                        // Get videos
                        var chartVideos = chartCountry in window.myCharts ?
                            window.myCharts[chartCountry] : [];
                        loadVideos = chartVideos.slice(0, window.siteConf.loadMore);
                        if (loadVideos.length > 0) {
                            // Update load more configuration
                            loadMore = {
                                type: 'charts',
                                total: chartVideos.join(''),
                                loaded: loadVideos.join('')
                            };
                            // Load videos
                            library.videos.display(loadVideos.join(''), true, chartVideos.length > 10, loadMore);
                        } else {
                            load.addClass('load-error').find('span').text('Sorry, videos are not found in this chart');
                        }
                    } else if (query.match(/^@Favorites/i) instanceof Array) {
                        // Update layouts
                        videosMenu.find('[data-video-panel]').removeClass('active');
                        videosArea.find('[data-video-panel]').removeClass('active');
                        videosMenu.find('[data-video-panel="favorites"]').addClass('active');
                        videosArea.find('[data-video-panel="favorites"]').addClass('active');
                        // Get favorite videos
                        var favoriteVideos = library.fevorites.getFevorites().reverse();
                        loadVideos = favoriteVideos.slice(0, window.siteConf.loadMore);
                        if (loadVideos.length > 0) {
                            // Update load more configuration
                            loadMore = {
                                type: 'favorites',
                                total: favoriteVideos.join(''),
                                loaded: loadVideos.join('')
                            };
                            // Set title
                            library.setTitle('Favorite videos | {{site-name}}', {'{{site-name}}': window.siteConf.siteName});
                            // Load videos
                            library.videos.display(loadVideos.join(''), true, favoriteVideos.length > 10, loadMore);
                        } else {
                            load.addClass('load-error').find('span').text('You don\'t have favorite videos');
                        }
                    } else if (query.match(/^@Search/i) instanceof Array) {
                        // Get last search
                        var lastSearch = localStorage.getItem('lastSearch');
                        lastSearch = typeof lastSearch === 'string' ? lastSearch : '3D video';
                        // Update query
                        library.setQuery(lastSearch);
                    } else {
                        // Normal search
                        library.videos.search(query);
                    }
                } else {
                    // Normal search
                    library.videos.search(query);
                }
            },
            more: function () {
                if (typeof window.loadMore === 'object') {
                    switch (window.loadMore.type) {
                        case 'charts':
                        case 'favorites':
                            // Get remaining videos
                            var remainVideos = library.videos.filter(window.loadMore.total, window.loadMore.loaded);
                            // Get first 10 videos
                            var remainTen = remainVideos.slice(0, window.siteConf.loadMore).join('');
                            // Update screen
                            load.addClass('load-show').find('span').text('Please wait, loading videos...');
                            lMore.removeClass('show-me');
                            // Update videos list
                            library.videos.display(remainTen, true, remainVideos.length > 10, {
                                type: window.loadMore.type,
                                total: window.loadMore.total,
                                loaded: window.loadMore.loaded + remainTen
                            });
                            break;
                        case 'search':
                            load.addClass('load-show').find('span').text('Please wait, loading videos...');
                            lMore.removeClass('show-me');
                            library.videos.display(window.loadMore.query);
                            break;
                    }
                }
            },
            getMore: function (videoID, videoToken, callback) {
                if (typeof videoID === 'string' && typeof callback === 'function') {
                    // Create cache storage
                    if (typeof window.mediaLinks !== 'object') {
                        window.mediaLinks = {};
                    }
                    // Search on cache
                    if (videoID in window.mediaLinks) {
                        callback(window.mediaLinks[videoID]);
                    } else {
                        // Get media links
                        $.ajax({
                            url: './ajax',
                            type: 'post',
                            dataType: 'json',
                            data: {purpose: 'getMore', v: videoID, t: videoToken}
                        }).always(function (response, status) {
                            var runtimeError = null, mediaLinks = [];
                            // Process media links
                            if (status === 'success') {
                                if (typeof response === 'object' && response !== null && typeof response.status === 'boolean') {
                                    if (response.status) {
                                        for (var i in response.links) {
                                            if (response.links.hasOwnProperty(i)) {
                                                mediaLinks.push(response.links[i]);
                                            }
                                        }
                                    } else {
                                        runtimeError = response.error;
                                    }
                                } else {
                                    runtimeError = 'Invalid data received from server';
                                }
                            } else {
                                runtimeError = 'Failed to connect server';
                            }
                            // Check media links
                            if (mediaLinks.length > 0) {
                                window.mediaLinks[videoID] = mediaLinks;
                                callback(mediaLinks);
                            } else {
                                callback(typeof runtimeError === 'string' ? runtimeError : 'Failed to detect video links');
                            }
                        });
                    }
                }
            }
        };

        // Check for app page
        window.appPage = $('body').attr('data-app') === 'yes';

        window.onYouTubeIframeAPIReady = function () {
            window.YouTubeReady = true;
        };

        // Embed YouTube Player API
        if (window.appPage) {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Define some dom elements as veriables
        var sin = $('#search_in'), sgo = $('#search_go'), load = $('#load'),
            videos = $('#videos'), lMore = $('#loadMore'), loadIcon = $('#loadIcon');

        var videosMenu = $('#videosMenu'), videosArea = $('#videosArea');

        $('#menuMobile').slicknav({
            prependTo: '#header'
        });

        // Define search auto complete
        window.searchComplete = ['@Search', '@Favorites', '@Charts'];

        // Load countries list
        library.loadCharts(function (charts) {
            if (typeof charts === 'object') {
                window.countries = {};
                window.myCharts = {};
                window.countryCodes = [];
                window.countryNames = [];
                var screenLayer = $('<div>');
                for (var continent in charts) {
                    if (charts.hasOwnProperty(continent)) {
                        // Add Continent to screen
                        screenLayer.append($('<div>').addClass('countryGroup').text(continent));
                        var continentCountries = $('<ul>');
                        continentCountries.addClass('countryList');
                        for (var countryCode in charts[continent]) {
                            if (charts[continent].hasOwnProperty(countryCode)) {
                                var countryName = charts[continent][countryCode].name;
                                // Update global variables
                                window.countryCodes.push(countryCode);
                                window.countryNames.push(countryName);
                                window.countries[countryCode] = countryName;
                                window.myCharts[countryCode] = charts[continent][countryCode].list;
                                // Add country to screen
                                continentCountries.append($('<li>')
                                        .addClass('chartCountry').attr({
                                            'data-country-code': countryCode,
                                            'data-country-name': countryName
                                        })
                                        .append($('<span>').addClass('flag flag-' + countryCode))
                                        .append(countryName)
                                );
                            }
                        }
                        screenLayer.append(continentCountries);
                    }
                }
                window.countryCodes.sort();
                window.countryNames.push();
                for (var i = 0; i < window.countryNames.length; i++) {
                    window.searchComplete.push('@Charts=' + window.countryNames[i]);
                }
                $('#countriesList').html(screenLayer);

            }
            // Start process
            if (window.appPage) {
                library.videos.grab();
            }
        });

        // Enable auto complete
        sin.autocomplete({
            source: function (request, response) {
                var query = request.term.trim(), enterTime = parseFloat(sin.attr('data-enter-time'));
                enterTime = isNaN(enterTime) ? 0 : enterTime;
                if (query.substr(0, 1) === '@') {
                    var values = [];
                    for (var i = 0; i < window.searchComplete.length; i++) {
                        var value = window.searchComplete[i];
                        if (value.toLowerCase().substr(0, query.length) === query.toLowerCase()) {
                            values.push(value);
                        }
                        if (values.length >= 10) {
                            break;
                        }
                    }
                    response(values);
                } else {
                    var ajaxTime = Date.now();
                    window.searchAjax = $.ajax({
                        url: '//suggestqueries.google.com/complete/search',
                        type: 'GET',
                        dataType: 'jsonp',
                        cache: false,
                        data: {
                            q: query,
                            ds: 'yt',
                            client: 'youtube'
                        }
                    }).always(function (res) {
                        var values = [];
                        if (enterTime === 0 || (parseFloat(sin.attr('data-enter-time')) === enterTime && ajaxTime > enterTime + 2000)) {
                            if (res instanceof Array && res[1] instanceof Array) {
                                for (var i in res[1]) {
                                    if (res[1].hasOwnProperty(i)) {
                                        values.push(res[1][i][0]);
                                    }
                                }
                            }
                        }
                        response(values);
                    });
                }
            },
            select: function (e, ui) {
                sin.val(ui.item.value);
                sin.blur();
                sgo.trigger('click');
            }
        });

        // Tool tip configurations
        window.SpecialTips = {
            '@': {
                theme: 'dark qtip-smooth'
            },
            '!': {
                at: 'top center',
                my: 'bottom center',
                theme: 'dark qtip-smooth qtip-help'
            },
            '=': {
                at: 'top center',
                my: 'bottom center',
                theme: 'dark qtip-smooth'
            }
        };
        // Offline Entertainment jQuery functions library
        $.fn.tip = function () {
            if (this.length !== 0 &&
                typeof this.attr('data-tip') === 'string' &&
                typeof this.attr("data-hasqtip") === "undefined") {
                this.qtip({
                    content: {text: ""},
                    events: {
                        show: function (event, api) {
                            var TipCnf = api.target.attr("data-tip"),
                                TipDat = {content: '', theme: 'dark', at: 'top right', my: 'bottom left'};
                            if (typeof TipCnf === 'string') {
                                if (TipCnf.slice(0, 1) === "*") {
                                    TipCnf = TipCnf.slice(1);
                                }
                                if (typeof TipCnf === "string" && TipCnf.length >= 1) {
                                    TipCnf = TipCnf.split("{|}");
                                    if (TipCnf.length >= 1) {
                                        var Special = TipCnf[0].slice(0, 1), Content = TipCnf[0].slice(1);
                                        // Update tip configuration
                                        if (typeof window.SpecialTips === 'object' &&
                                            Special in window.SpecialTips) {
                                            TipDat.content = Content;
                                            var SepcialTip = window.SpecialTips[Special];
                                            for (var key in SepcialTip) {
                                                if (SepcialTip.hasOwnProperty(key)) {
                                                    TipDat[key] = SepcialTip[key];
                                                }
                                            }
                                        } else {
                                            TipDat.content = TipCnf[0];
                                            if (typeof TipCnf[1] === 'string') {
                                                TipDat.theme = TipCnf[1];
                                            }
                                            if (typeof TipCnf[2] === 'string') {
                                                TipDat.at = TipCnf[2];
                                            }
                                            if (typeof TipCnf[3] === 'string') {
                                                TipDat.my = TipCnf[3];
                                            }
                                        }
                                        // Update qtip configuration
                                        if (TipDat.content.length >= 1) {
                                            api.set({
                                                "content.text": TipDat.content,
                                                "style.classes": "qtip-shadow qtip-" + TipDat.theme,
                                                "position.at": TipDat.at,
                                                "position.my": TipDat.my,
                                                "position.viewport": $(window)
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                if (this.attr("data-tip").slice(0, 1) !== "*") {
                    this.qtip("show");
                    this.qtip("api").set("show.event", "focus mouseenter");
                    this.qtip("api").set("hide.event", "blur mouseleave");
                } else {
                    this.qtip("api").set("hide.effect", false).set("show.effect", false);
                    this.qtip("show").qtip("hide");
                    this.qtip("api").set("hide.effect", true).set("show.effect", true);
                    this.qtip("api").set("show.event", "click");
                    this.qtip("api").set("hide.event", "blur mouseleave");
                }
            }
            return this;
        };

        // Display help tour
        var helpTour = $('#helpTour');
        if (helpTour.length !== 0) {
            var helpTourEvent,
                helpTourClose = helpTour.find('.fa-close'),
                helpTourCount = localStorage.getItem('helpTour');
            // Get help tour count
            helpTourCount = typeof helpTourCount === 'string' ? parseInt(helpTourCount, 10) : 0;
            helpTourCount = helpTourCount > 0 ? helpTourCount : 0;
            // Display help tour
            if (helpTourCount <= 3 && $(window).width() > 800) {
                helpTourEvent = helpTour.bPopup({
                    modalClose: false,
                    modalColor: 'white',
                    onClose: function () {
                        localStorage.setItem('helpTour', ++helpTourCount);
                    }
                });
            }
            // Close help tour
            helpTourClose.on('click', function () {
                if (typeof helpTourEvent === 'object' && 'close' in helpTourEvent) {
                    helpTourEvent.close();
                }
            });
        }
        // High speed download text
        var hsdTXT = 'Enable high speed download for downloading media file directly from YouTube server. ' +
            'If you failed to download media in high speed please uncheck high speed download option and try again.';
        // Handle history events
        if ('onpopstate' in window) {
            window.onpopstate = function () {
                library.videos.grab();
            };
        }
        // Show goto top button
        var gotoTop = $('#gotoTop'), rsParent = $('#rsParent');
        $(window).on('scroll', function () {
            if ($(window).scrollTop() > 350) {
                gotoTop.addClass('showit');
            } else {
                gotoTop.removeClass('showit');
            }
        });
        // Get visitor country (cache)
        var countryCache = localStorage.getItem('countryCache');
        countryCache = typeof countryCache == 'string' ? countryCache.split(',') : [null, 0];
        if (countryCache.length == 2) {
            var ccTime = parseInt(countryCache[1], 10);
            ccTime = ccTime > 0 ? ccTime : 0;
            countryCache = [countryCache[0], ccTime];
        } else {
            countryCache = [null, 0];
        }
        // Get visitor country (latest)
        if (countryCache[1] < (parseInt(Date.now() / 100) - (86400 * 7))) {
            $.ajax({url: 'http://ip-api.com/json/', dataType: 'jsonp'})
                .always(function (response, status) {
                    if (status == 'success' && typeof response == 'object' && response != null && 'countryCode' in response) {
                        localStorage.setItem('countryCache', response.countryCode + ',' + parseInt(Date.now() / 100));
                        window.visitorCountry = response.countryCode;
                    }
                });
        } else {
            window.visitorCountry = countryCache[0];
        }
        // Run process on demand
        $(document)
            .on('mouseover', '[data-tip]', function () {
                $(this).tip();
            })
            .on('click', '#gotoTop', function () {
                $('html, body').animate({scrollTop: 0}, 300);
            })
            .on('click', '.mso-icon, .mso-label', function () {
                var mediaSpeed = $(this).closest('.media-speed');
                if (mediaSpeed.hasClass('high-speed-yes')) {
                    mediaSpeed.removeClass('high-speed-yes').addClass('high-speed-no');
                } else {
                    mediaSpeed.removeClass('high-speed-no').addClass('high-speed-yes');
                }
            })
            .on('click', '.video-fav', function () {
                // Update storage
                var _this = $(this),
                    videoID = _this.closest('[data-vid]').attr('data-vid'),
                    status = library.fevorites.toggleFevorite(videoID);
                // Update screen
                _this
                    .removeClass('fa-heart fa-heart-o')
                    .addClass('fa-heart' + (status !== 'add' ? '-o' : ''));
            })
            .on('click', '.video-share', function () {
                // Get initial details
                var videoID = $(this).closest('[data-vid]').attr('data-vid'),
                    mp3Size = $(this).closest('[data-mp3size]').attr('data-mp3size'),
                    videoTitle = $(this).closest('[data-vtitle]').attr('data-vtitle');
                // Update sharing configuration
                addthis.update('share', 'title', videoTitle + '.mp3 [' + mp3Size + '] @320kbps - download now');
                addthis.update('share', 'url', window.siteConf.siteLink + library.safeString(videoTitle) + '(' + videoID + ')');
                addthis.ready();
                // Show sharing panel
                $('#shareArea').find('.addthis_button_more').click();
            })
            .on('click', '#sharePage', function () {
                // Update sharing configuration
                addthis.update('share', 'url', window.location.href);
                addthis.update('share', 'title', window.document.title);
                addthis.ready();
                // Show sharing panel
                $('#shareArea').find('.addthis_button_more').click();
            })
            .on('click', '.chartCountry', function () {
                // Hide countries
                $('#countriesList').css('display', 'none');
                // Get chart country details
                var code = $(this).attr('data-country-code'),
                    name = $(this).attr('data-country-name');
                // Update chart country on cache
                Cookies.set('chartCountryCode', code);
                localStorage.setItem('chartCountryCode', code);
                // Update query
                library.setQuery('@Charts=' + name);
                // Scroll to charts headers
                $('html, body').animate({scrollTop: $('#chooseCountry').offset().top}, 300);
            })
            .on('click', '.chooseCountry', function () {
                var countriesList = $('#countriesList');
                if (countriesList.is(':visible')) {
                    countriesList.css('display', 'none');
                } else {
                    countriesList.css('display', 'block');
                }
            })
            .on('click', '.v-play', function () {
                var videoID = $(this).closest('[data-vid]').attr('data-vid'),
                    videoPlayer = $('#videoPlayer'),
                    windowWidth = $(window).width();
                // Close music player
                var mPlay = $('.video-mplay.playing-music');
                if (mPlay.length !== 0) {
                    mPlay.click();
                } else {
                    if (typeof library.music === 'object' && 'close' in library.music) {
                        library.music.close();
                    }
                }
                // Update video player
                videoPlayer.html($('<iframe>').attr({
                    src: 'https://www.youtube.com/embed/' + videoID + '?autoplay=1',
                    frameborder: '0',
                    allowfullscreen: 'true'
                }));
                if (windowWidth > 806) {
                    videoPlayer.css({width: '800px', height: '450px'});
                } else {
                    var width = windowWidth - (windowWidth % 16), height = (width / 16) * 9;
                    videoPlayer.css({width: width + 'px', height: height + 'px'});
                }
                // Display popup
                videoPlayer.bPopup({
                    onClose: function () {
                        videoPlayer.html('');
                    }
                });
            })
            .on('click', '.v-open', function () {
                // Get intial video details
                var videoTitle = $(this).closest('[data-vtitle]').attr('data-vtitle'),
                    videoID = $(this).closest('[data-vid]').attr('data-vid');
                // Update query
                Cookies.set('searchTerm', encodeURIComponent(videoTitle + ' (' + videoID + ')'));
                library.setQuery(library.safeString(videoTitle) + '(' + videoID + ')', true);
                // Scroll page
                $('html, body').animate({scrollTop: $('#videosList').offset().top}, 300);
            })
            .on('click', '.v-owner', function () {
                // Get intial video details
                var videoOwner = $(this).closest('[data-vowner]').attr('data-vowner'),
                    videoUser = $(this).closest('[data-vuser]').attr('data-vuser');
                // Update query
                Cookies.set('searchTerm', encodeURIComponent(videoOwner + ' (' + videoUser + ')'));
                library.setQuery(library.safeString(videoOwner) + '(' + videoUser + ')', true);
                // Scroll page
                $('html, body').animate({scrollTop: $('#videosList').offset().top}, 300);
            })
            .on('click', '.v-dl-mp3', function () {
                var vitem = $(this).closest('[data-vid]');
                if (window.siteConf.useFFmpeg) {
                    // Display mp3 download panel
                    vitem.removeClass('v-more');
                    if (vitem.hasClass('v-mp3')) {
                        vitem.removeClass('v-mp3');
                    } else {
                        vitem.addClass('v-mp3');
                        vitem.trigger('getMP3');
                    }
                } else {
                    // Get video details
                    var video = vitem.attr('data-vid'),
                        title = vitem.attr('data-vtitle'),
                        token = vitem.attr('data-vtoken').replace(/\-/g, '');
                    // Prepare download link (init)
                    var downloadToken = (token + library.asciiHEX(video + 'mp3') + '0040').match(/.{8}/g).join('-');
                    // Prepare download name
                    var downloadName = encodeURIComponent(title.replace(/\//g, '')).replace(/%20/ig, '+');
                    downloadName += ' - (' + window.location.host + ').mp3';
                    // Prepare download link
                    var downloadLink = './download/' + downloadToken + '/' + downloadName;
                    // Download media
                    library.downloadAs(downloadLink, downloadName, $('body').attr('data-download-type') === 'inpage');
                }
            })
            .on('click', '.v-dl-more', function () {
                var vitem = $(this).closest('[data-vid]');
                // Display download panel
                vitem.removeClass('v-mp3');
                if (vitem.hasClass('v-more')) {
                    vitem.removeClass('v-more');
                } else {
                    vitem.addClass('v-more');
                    vitem.trigger('getMore');
                }
            })
            .on('click', '.media-parent', function () {
                // Get initial details
                var elm = $(this).closest('[data-vid]'),
                    video = elm.attr('data-vid'),
                    title = elm.attr('data-vtitle'),
                    token = elm.attr('data-vtoken').replace(/\-/g, '');
                // Prepare download link (init)
                var downloadToken, downloadName = '', downloadLink, downloadForce = false;
                // Force downloading
                downloadForce = $('body').attr('data-download-type') === 'inpage';
                // Start process
                if ($(this).find('.media-block').hasClass('media-type-mp3')) {
                    // Create download token
                    var mp3Bitrate = parseInt($(this).attr('data-mp3-bitrate'), 10).toString(16);
                    var bitrateHEX = new Array((4 - mp3Bitrate.length) + 1).join('0') + mp3Bitrate;
                    downloadToken = (token + library.asciiHEX(video + 'mp3') + bitrateHEX).match(/.{8}/g).join('-');
                    // Prepare download name
                    downloadName += encodeURIComponent(title.replace(/\//g, '')).replace(/%20/ig, '+');
                    downloadName += ' - (' + window.location.host + ') ';
                    downloadName += $(this).attr('data-mp3-bitrate') + 'kbps';
                    downloadName += '.mp3';
                    // Prepare download link
                    downloadLink = './download/' + downloadToken + '/' + downloadName;
                } else {
                    // Get media details
                    var mediaEXT = $(this).attr('data-media-extension'),
                        mediaQLT = $(this).attr('data-media-quality'),
                        mediaTAG = $(this).attr('data-media-itag');
                    // Prepare download name
                    downloadName += encodeURIComponent(title.replace(/\//g, '')).replace(/%20/ig, '+');
                    downloadName += ' - (' + window.location.host + ') ';
                    downloadName += mediaQLT + 'p';
                    downloadName += '.' + mediaEXT;
                    // Prepare token for download link
                    var itagHEX = parseInt(mediaTAG, 10).toString(16);
                    itagHEX = new Array((4 - itagHEX.length) + 1).join('0') + itagHEX;
                    downloadToken = (token + library.asciiHEX(video + '\x00\x00\x00') + itagHEX).match(/.{8}/g).join('-');
                    // Prepare download link
                    downloadLink = './download/' + downloadToken + '/' + downloadName;
                    // Check for high speed download
                    if (elm.find('.high-speed-yes').length != 0) {
                        downloadLink += '?highSpeed=yes';
                        downloadForce = true;
                    }
                }
                // Download media
                library.downloadAs(downloadLink, downloadName, downloadForce);
            })
            .on('getMore', '[data-vid]', function () {
                var downloadPanel = $(this).find('.v-download'),
                    mediaFail = downloadPanel.find('.media-fail'),
                    mediaView = downloadPanel.find('.media-view'),
                    mediaItems = downloadPanel.find('.media-items');
                // Update screen with media items
                if (!(downloadPanel.hasClass('media-items-load') || downloadPanel.hasClass('media-items-ready'))) {
                    // Show media load icon
                    downloadPanel.removeClass('media-items-failed').addClass('media-items-load');
                    // Get media files
                    library.videos.getMore($(this).attr('data-vid'), $(this).attr('data-vtoken'), function (result) {
                        downloadPanel.removeClass('media-items-load');
                        if (typeof result === 'object') {
                            var vdlUL = $('<ul>');
                            for (var i in result) {
                                if (result.hasOwnProperty(i)) {
                                    // Get media data and element
                                    var mediaDAT = result[i], mediaDOM = $('<li>');
                                    // Update configuration
                                    mediaDOM.addClass('media-parent');
                                    if (mediaDAT.dash) {
                                        if (mediaDAT.type === 'video') {
                                            mediaDOM.addClass('video-streams');
                                        } else {
                                            mediaDOM.addClass('audio-streams');
                                        }
                                    } else {
                                        mediaDOM.addClass('normal-videos');
                                    }
                                    // Add media details
                                    var mediaQuality = mediaDAT.type === 'video' ? mediaDAT.video.height : mediaDAT.audio.bitrate;
                                    if (mediaQuality !== null) {
                                        mediaDOM.attr({
                                            'data-media-extension': mediaDAT.extension,
                                            'data-media-quality': mediaQuality,
                                            'data-media-size': mediaDAT.size,
                                            'data-media-itag': mediaDAT.itag,
                                            'data-media-link': mediaDAT.link
                                        });
                                        // Media classes
                                        var mediaClass = ['media-block'];
                                        mediaClass.push('media-type-' + mediaDAT.extension);
                                        if (typeof mediaDAT.video === 'object' && mediaDAT.video['3d']) {
                                            mediaClass.push('media-feature-3d');
                                        }
                                        // Update content
                                        mediaDOM.html($('<div>')
                                            .addClass(mediaClass.join(' '))
                                            .append($('<div>').addClass('media-3d').text('3D'))
                                            .append($('<div>').addClass('media-eq')
                                                .append($('<div>').addClass('media-ext').text(mediaDAT.extension.toUpperCase()))
                                                .append(mediaDAT.type === 'video' ?
                                                    $('<div>').addClass('media-qlt').text(mediaDAT.video.height + 'p')
                                                    : $('<div>').addClass('media-qlt').text(parseInt(mediaDAT.audio.bitrate / 1000, 10) + 'kbps')
                                            ))
                                            .append($('<div>').addClass('media-sz').text(library.HumanBytes(mediaDAT.size, true, true) + 'B')));
                                        // Update buttons
                                        vdlUL.append(mediaDOM);
                                    }
                                }
                            }
                            mediaItems.html(vdlUL);
                            window.$Grid = vdlUL.isotope({
                                itemSelector: 'li',
                                layoutMode: 'fitRows',
                                getSortData: {
                                    extension: '[data-media-extension]',
                                    quality: '[data-media-quality] parseInt',
                                    size: '[data-media-size] parseInt'
                                }
                            });
                            // Show download panel
                            downloadPanel.addClass('media-items-ready');
                            mediaView.find('[data-filter-type="normal-videos"]').trigger('click');
                            mediaView.find('[data-sort-type="quality"]').trigger('click');
                        } else {
                            downloadPanel.addClass('media-items-failed');
                            mediaFail.text(result);
                        }
                    });
                }
            })
            .on('getMP3', '[data-vid]', function () {
                var downloadPanel = $(this).find('.v-music'), mediaFail = downloadPanel.find('.media-fail');
                // Update screen with media items
                if (!(downloadPanel.hasClass('media-items-load') || downloadPanel.hasClass('media-items-ready'))) {
                    // Show media load icon
                    downloadPanel.removeClass('media-items-failed').addClass('media-items-load');
                    // Get media files
                    library.videos.getMore($(this).attr('data-vid'), $(this).attr('data-vtoken'), function (result) {
                        downloadPanel.removeClass('media-items-load');
                        if (typeof result === 'object') {
                            downloadPanel.addClass('media-items-ready');
                        } else {
                            downloadPanel.addClass('media-items-failed');
                            mediaFail.text(result);
                        }
                    });
                }
            })
            .on('keypress', '#search_in', function (e) {
                if (e.keyCode === 13) {
                    $(this).attr('data-enter-time', Date.now());
                    sin.autocomplete('close');
                    if (typeof window.searchAjax === 'object') {
                        window.searchAjax.abort();
                    }
                    library.setQuery($(this).val());
                }
            })
            .on('click', '#search_go', function () {
                library.setQuery(sin.val());
            })
            .on('click', '.media-filter li', function () {
                $(this).closest('.media-filter').find('li').removeClass('active');
                $(this).addClass('active');
                var filterType = $(this).attr('data-filter-type');
                $(this).closest('.v-download').find('.media-items ul').isotope({filter: '.' + filterType});
            })
            .on('click', '.media-sort li', function () {
                $(this).closest('.media-sort').find('li').removeClass('active');
                $(this).addClass('active');
                var sortType = $(this).attr('data-sort-type');
                $(this).closest('.v-download').find('.media-items ul').isotope({
                    sortBy: sortType,
                    sortAscending: false
                });
            })
            .on('click', '#loadMore span', function () {
                library.videos.more();
            })
            .on('click', '[data-special-link]', function () {
                library.setQuery($(this).attr('data-special-link'));
                return false;
            });
    });
})(window.jQuery);
