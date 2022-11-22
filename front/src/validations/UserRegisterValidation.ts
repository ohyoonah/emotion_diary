const emailValidation = /^/;
const nameValidation = /^/;
const passwordValidation = /^/;

function validationFn(id: string, value: string): boolean {
    if (id === "email") {
        return emailValidation.test(value);
    }

    if (id === "name") {
        return nameValidation.test(value);
    }

    if (id === "password") {
        return passwordValidation.test(value);
    }

    return false;
}

export default validationFn;
