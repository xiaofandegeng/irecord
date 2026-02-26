export const playHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    switch (type) {
        case 'light':
            navigator.vibrate(15)
            break
        case 'medium':
            navigator.vibrate(30)
            break
        case 'heavy':
            navigator.vibrate(50)
            break
        default:
            navigator.vibrate(15)
    }
}
