import { StyleSheet } from 'react-native';

export const colors = {
    primary: '#007AFF',
    background: '#FFFFFF',
    error: '#FF3B30',
    text: {
        primary: '#000000',
        secondary: '#666666',
        error: '#FF3B30',
    },
    tier: {
        s: '#FF6B6B',
        a: '#FFA94D',
        b: '#FFD43B',
        c: '#74C476',
        d: '#4D94FF',
        e: '#817EFF',
        f: '#F78CFF',
    }
};

export const typography = {
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    body: {
        fontSize: 16,
    },
    small: {
        fontSize: 14,
    }
};

export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: typography.body.fontSize,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.background,
        fontSize: typography.body.fontSize,
        fontWeight: 'bold',
    },
    error: {
        color: colors.error,
        marginBottom: 10,
        textAlign: 'center',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
}); 