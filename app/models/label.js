const sequelize = require('../database');
const {DataTypes, Model} = require('sequelize');

class Label extends Model {};

Label.init({
    name: DataTypes.STRING,
    color: DataTypes.STRING
}, {
    sequelize,
    tableName: 'label'
});

module.exports = Label;