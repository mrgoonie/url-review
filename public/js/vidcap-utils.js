function getYoutubeVideoUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

function getVideoIdFromYoutubeUrl(url) {
    try {
        // Extract the video ID from the URL
        // console.log('url :>> ', url);
        let videoId;
        if (url.indexOf("youtu.be/") > -1) {
            videoId = url.split("youtu.be/")[1];
            if (videoId.indexOf("?") > -1) videoId = videoId.split("?")[0];
        } else {
            videoId = url.split("v=")[1];
            const ampersandPosition = videoId.indexOf("&");
            // If the URL contains additional parameters, remove them
            if (ampersandPosition !== -1) {
                return videoId.substring(0, ampersandPosition);
            }
        }
        return videoId;
    } catch (error) {
        console.error("Error extracting video ID:", error);
        throw error;
    }
}