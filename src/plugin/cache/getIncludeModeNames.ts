import {FindOptions} from "sequelize";
import _ from "lodash";

export default ((options: FindOptions) => {
    const ins = [];
    const addInclude = (include: any) => {
        // TODO 完善include表的计算, 目前只考虑 IncludeOptions 情况
        for (let i of include || []) {
            ins.push(i.model.name);
            addInclude(i.include);
        }
    };
    addInclude(options.include);
    return _.uniq(ins).sort();
});