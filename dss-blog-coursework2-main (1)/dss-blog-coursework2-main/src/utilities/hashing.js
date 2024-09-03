import bcrypt from 'bcrypt';

const saltRounds = 10

export function generateHash(password){
    return bcrypt.hashSync(password, saltRounds);
}

export function comparePassword(password, hash){
    return bcrypt.compareSync(password, hash);
}