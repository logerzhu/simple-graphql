import Sequelize from "sequelize";

export default async function (sequelize: Sequelize) {
    const User = sequelize.models['User'];
    const Todo = sequelize.models['Todo'];
    const UserProfile = sequelize.models['UserProfile'];
    for (let index = 1; index < 100; index++) {
        await User.create({
            id: index,
            userName: 'Demo' + index,
            password: 'Password' + index,
            blocked: index % 10 === 0,
            registerAt: new Date()
        });
        if (index % 2 === 0) {
            await UserProfile.create({
                ownerId: index,
                realName: 'Demo' + index + '.Real',
                age: index,
                gender: index % 2 === 0 ? 'Male' : 'Female'
            });
        }
        if (index % 10 === 0) {
            for (let index2 = 0; index2 < 30; index2++) {
                await Todo.create({
                    ownerId: index,
                    title: 'Task-' + index + '-' + index2,
                    description: 'Task Desc ' + index + '-' + index2,
                    completed: index2 % 3 === 0,
                    dueAt: index2 % 3 === 0 ? new Date() : new Date(Date.now() + 10000000)
                });
            }
        }
    }
}