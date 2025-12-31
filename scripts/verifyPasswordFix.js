const validator = (v) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/.test(v);
};

const generatePassword = () => {
    return Math.random().toString(36).slice(-8) + 'Aa1' + Math.random().toString(36).slice(-8).toUpperCase();
};

const test = () => {
    const pwd = generatePassword();
    const isValid = validator(pwd);
    console.log(`Generated Password: ${pwd}`);
    console.log(`Is Valid: ${isValid}`);

    if (isValid) {
        console.log('SUCCESS: Password meets requirements.');
    } else {
        console.error('FAILURE: Password does NOT meet requirements.');
        process.exit(1);
    }
};

test();
