const pool = require("../config/db")

let Certification = function (
  certification_name,
  description,
  activity_start,
  activity_end,
  amount_hours,
  id_activity,
  id_uploaded,
  id_user
) {
  this.name = certification_name;
  this.description = description;
  this.activity_start = activity_start;
  this.activity_end = activity_end;
  this.amount_hours = amount_hours;
  this.amount_valid_hours = 0;//hoursValidation(amount_hours);
  this.id_activity = id_activity;
  this.id_uploaded = id_uploaded;
  this.id_user = id_user;
}

Certification.prototype.listAll = function () {

}

Certification.prototype.listPerUser = function (id_user) {

}

Certification.prototype.create = function () {
  const insert = 'INSERT INTO certifications' +
    ' (name, description, activity_start, activity_end, amount_hours, amount_valid_hours, id_activity, id_uploaded, id_user_fk)' +
    ' VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)' +
    ' RETURNING *';
  const values = [this.name, this.description, this.activity_start, this.activity_end, this.amount_hours, this.amount_valid_hours, this.id_activity, this.id_uploaded, this.id_user];
  // console.log("certification create - log - " + values)
  return new Promise((resolve, reject) => {
    pool.query(insert, values, (error, results) => {
      if (error) {
        reject("Create Certification:" + error)
      } else {
        resolve(results.rows[0])
      }
    })
  })
}

Certification.prototype.delete = function (id_certification) {
}

/**
 * INCOMPLETO - falta considerar as 'horas maximas' por atividade especifica
 * e/ou a 'quantidade de vezes' que ela pode ser usada
 */
Certification.prototype.hoursValidation = function (
  amount_hours,
  searchedActivity,
  searchedUser,
  searchedCourse
) {
  const {
    hours_per_instance,
    hours_max,
    is_extension_activity,
  } = searchedActivity;

  const { email } = searchedUser;

  if (amount_hours < hours_per_instance) {
    throw new Error('A quantidade de horas da atividade não é o suficiente');
  }

  var values;
  const type_activity = is_extension_activity ? 'extension_activity' : 'complementary_activity'

  const update = 'UPDATE users' +
    ' SET $1 = $2' +
    ' WHERE email = $3' +
    ' RETURNING *';

  switch (type_activity) {
    case 'complementary_activity':
      if (parseFloat(searchedCourse.max_complementary_activity) > parseFloat(searchedUser.complementary_activity)) {
        var variation = searchedCourse.max_complementary_activity - searchedUser.complementary_activity;

        if (variation < hours_per_instance) {
          values = [type_activity, parseFloat(searchedUser.complementary_activity) + parseFloat(variation), searchedUser.email]
        } else {
          values = [type_activity, parseFloat(searchedUser.complementary_activity) + parseFloat(hours_per_instance), searchedUser.email]
        }
      }

      break;

    case 'extension_activity':
      if (parseFloat(searchedCourse.max_extension_activity) > parseFloat(searchedUser.extension_activity)) {
        var variation = searchedCourse.max_extension_activity - searchedUser.extension_activity;

        if (variation < hours_per_instance) {
          values = [type_activity, parseFloat(searchedUser.extension_activity) + parseFloat(variation), searchedUser.email]
        } else {
          values = [type_activity, parseFloat(searchedUser.extension_activity) + parseFloat(hours_per_instance), searchedUser.email]
        }
      }

      break;
  }

  return new Promise((resolve, reject) => {
    pool.query(update, values, (error, results) => {
      if (error) {
        reject(`Erro ao adicionar horas do usuario -> ${error} and code ${error.code}`)
      } else {
        resolve(results, type_activity)
      }
    })
  })
}

module.exports = Certification;