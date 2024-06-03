
async function generateLast12MonthsData(model) {
    try {
        const last12Months = [];
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);

        for (let i = 11; i >= 0; i--) {
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28);
            const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);
            const monthYear = endDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
            const count = await model.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            });
            last12Months.push({ month: monthYear, count });
        }

        return { last12Months };
    } catch (error) {
        console.error('Error:', error);
        throw error; 
    }
}


module.exports = {generateLast12MonthsData};
