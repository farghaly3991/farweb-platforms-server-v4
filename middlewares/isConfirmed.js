const AdminData = require("../models/adminData");
const Users = require("../models/users");

module.exports = async(req, res, next) => {
    const userId = req.params.userId || req.body.userId;
    const user = await Users.findOne({_id: userId});
    const adminData = await AdminData.findOne({admin: 1});
    if(!user.units.includes(unit)) throw("غير مصرح لك بالوصول لهده الوحدة");
    if(!adminData.deactiveStudentConfirmation && user.confirmed == 0) throw("بأنتظار تأكيد المدرس");
}