export const secondsToHMS = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    // Format seconds with leading zero if less than 10 for example 9 seconds becomes 09 seconds
    const formattedSecs = secs < 10 ?  `0${secs}`: `${secs}`

    if(hours > 0){
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m ${formattedSecs}s`
    }
}

export const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);

    // Extract the day, month and year from the Date object
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);

    return `${day}/${month}/${year}`
}

export const convertSpeedToPace = (speedMps: number): string => {

    // Convert speed (m/s) to seconds per kilometer
    const secondsPerKm = 1000 / speedMps;

    // Convert seconds to minutes and seconds
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);

    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`

    return `${minutes}:${formattedSeconds}`
}

export const truncateName = (name: string): string => {
    return name.length > 20 ? name.substring(0, 20) + '...' : name;
}