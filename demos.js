document.addEventListener("DOMContentLoaded", function () {
    const barCtx = document.getElementById("barChart").getContext("2d");
    const pieCtx = document.getElementById("pieChart").getContext("2d");
    let barChart, pieChart;
    let currentTab = "annual";

    // Add event listeners for contribution timing radio buttons
    document.getElementById("begining").addEventListener("change", calculateInterest);
    document.getElementById("end").addEventListener("change", calculateInterest);

    function calculateInterest() {
        // Get input values
        const initial = parseFloat(document.getElementById("initial").value) || 0;
        const annual = parseFloat(document.getElementById("annual").value) || 0;
        const monthly = parseFloat(document.getElementById("monthly").value) || 0;
        const rate = parseFloat(document.getElementById("rate").value) / 100 || 0;
        const freq = parseInt(document.getElementById("frequency").value);
        const years = parseInt(document.getElementById("years").value) || 0;
        const months = parseInt(document.getElementById("months").value) || 0;
        const taxRate = parseFloat(document.getElementById("tax").value) / 100 || 0;
        const contributionTiming = document.querySelector('input[name="contribution"]:checked').id;
        const contributeAtBeginning = contributionTiming === "begining";
        const totalMonths = years * 12 + months;
        const showTaxColumn = taxRate > 0;

        // Update table headers based on tax rate
        updateTableHeaders(showTaxColumn);

        // Data for charts
        let data = {
            labels: [],
            datasets: [
                { label: "Initial investment", data: [], backgroundColor: "rgb(43, 125, 219)" },
                { label: "Contributions", data: [], backgroundColor: "rgb(139, 188, 33)" },
                { label: "Interest", data: [], backgroundColor: "rgb(145, 0, 0)" },
                { label: "Tax Paid", data: [], backgroundColor: "rgb(200, 100, 0)" }
            ]
        };

        // Initialize tracking variables
        let balance = initial;
        let totalContribution = initial;
        let totalInterest = 0;
        let totalTaxPaid = 0;
        let yearlyData = [];

        // Monthly calculation loop
        for (let month = 1; month <= totalMonths; month++) {
            let deposit = 0;
            let contributionThisMonth = 0;

            // Calculate contributions for this period
            if (contributeAtBeginning) {
                // Add contributions at beginning of period
                if (monthly > 0) {
                    deposit += monthly;
                    contributionThisMonth += monthly;
                }
                if (month % 12 === 1 || month === 1) {
                    deposit += annual;
                    contributionThisMonth += annual;
                }
            }

            // Calculate interest for the period (on previous balance + current contributions if at beginning)
            const periodicRate = Math.pow(1 + rate, 1 / (12 / freq)) - 1;
            let interestBase = contributeAtBeginning ? balance + deposit : balance;
            let interest = interestBase * periodicRate;
            
            // Calculate and deduct tax
            let tax = interest * taxRate;
            let netInterest = interest - tax;
            
            // Update totals
            totalInterest += netInterest;
            totalTaxPaid += tax;
            
            if (!contributeAtBeginning) {
                // Add contributions at end of period
                if (monthly > 0) {
                    deposit += monthly;
                    contributionThisMonth += monthly;
                }
                if (month % 12 === 1 || month === 1) {
                    deposit += annual;
                    contributionThisMonth += annual;
                }
            }
            
            totalContribution += contributionThisMonth;
            balance = totalContribution + totalInterest;

            // Store yearly data for charts
            if (month % 12 === 0 || month === totalMonths) {
                const currentYear = Math.ceil(month / 12);
                data.labels.push(`Year ${currentYear}`);
                data.datasets[0].data.push(initial);
                data.datasets[1].data.push(totalContribution - initial);
                data.datasets[2].data.push(parseFloat(totalInterest.toFixed(2)));
                data.datasets[3].data.push(parseFloat(totalTaxPaid.toFixed(2)));
                
                yearlyData.push({
                    year: currentYear,
                    contribution: totalContribution,
                    interest: totalInterest,
                    tax: totalTaxPaid,
                    balance: balance
                });
            }
        }

        // Update Charts
        updateBarChart(data);
        updatePieChart(initial, totalContribution - initial, totalInterest, totalTaxPaid);

        // Update UI with calculated values
        document.getElementById("endingBalance").innerText = formatCurrency(balance);
        document.getElementById("totalPrincipal").innerText = formatCurrency(totalContribution);
        document.getElementById("totalContributions").innerText = formatCurrency(totalContribution - initial);
        document.getElementById("totalInterest").innerText = formatCurrency(totalInterest+totalTaxPaid);
        document.getElementById("totalTax").innerText = formatCurrency(totalTaxPaid);
        document.getElementById("totalInterestAfterTax").innerText = formatCurrency(totalInterest);

        // Generate appropriate table
        if (currentTab === "annual") {
            generateAnnualTable(yearlyData, showTaxColumn);
        } else {
            generateMonthlyTable(showTaxColumn, contributeAtBeginning);
        }
    }

    // ... (rest of your existing functions remain the same)
    function updateTableHeaders(showTaxColumn) {
        const tableHead = document.querySelector("table thead tr");
        if (showTaxColumn) {
            // Check if tax column already exists
            if (!document.getElementById("taxHeader")) {
                const interestHeader = tableHead.querySelector("th:nth-child(4)");
                const newHeader = document.createElement("th");
                newHeader.textContent = "Tax";
                newHeader.id = "taxHeader";
                interestHeader.insertAdjacentElement("afterend", newHeader);
            }
        } else {
            // Remove tax column if it exists
            const taxHeader = document.getElementById("taxHeader");
            if (taxHeader) {
                taxHeader.remove();
            }
        }
    }

    function updateBarChart(data) {
        if (barChart) barChart.destroy();
        
        barChart = new Chart(barCtx, {
            type: "bar",
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                        position: "bottom",
                        labels: {
                            font: { size: 14 },
                            boxWidth: 17,
                            padding: 4,
                        }
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(0) + 'K';
                                }
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    function updatePieChart(initial, contributions, interest, taxPaid = 0) {
        let total = initial + contributions + interest + taxPaid;
        let percentages = [
            ((initial / total) * 100).toFixed(1),
            ((contributions / total) * 100).toFixed(1),
            ((interest / total) * 100).toFixed(1),
            ((taxPaid / total) * 100).toFixed(1)
        ];

        pieChart.data.datasets[0].data = [initial, contributions, interest, taxPaid];
        pieChart.options.plugins.datalabels.formatter = (value, context) => {
            return percentages[context.dataIndex] + "%";
        };
        pieChart.update();
    }

    function generateAnnualTable(yearlyData, showTaxColumn) {
    let tableHTML = "";
    let prevYearData = { grossInterest: 0, tax: 0, netInterest: 0 };

    yearlyData.forEach((yearData, index) => {
        // Calculate values for this year
        const grossInterestThisYear = (yearData.interest + yearData.tax) - (prevYearData.grossInterest);
        const taxThisYear = yearData.tax - prevYearData.tax;
        const netInterestThisYear = yearData.interest - prevYearData.netInterest;
        
        if (showTaxColumn) {
            tableHTML += `
                <tr>
                    <td>${yearData.year}</td>
                    <td>${formatCurrency(index === 0 ? yearData.contribution : yearData.contribution - yearlyData[index-1].contribution)}</td>
                    <td>${formatCurrency(yearData.contribution)}</td>
                    <td>${formatCurrency(grossInterestThisYear)}</td>
                    <td>${formatCurrency(taxThisYear)}</td>
                    <td>${formatCurrency(yearData.interest)}</td>
                    <td>${formatCurrency(yearData.balance)}</td>
                </tr>`;
        } else {
            tableHTML += `
                <tr>
                    <td>${yearData.year}</td>
                    <td>${formatCurrency(index === 0 ? yearData.contribution : yearData.contribution - yearlyData[index-1].contribution)}</td>
                    <td>${formatCurrency(yearData.contribution)}</td>
                    <td>${formatCurrency(netInterestThisYear)}</td>
                    <td>${formatCurrency(yearData.interest)}</td>
                    <td>${formatCurrency(yearData.balance)}</td>
                </tr>`;
        }
        
        // Update previous year data
        prevYearData = { 
            grossInterest: yearData.interest + yearData.tax,
            tax: yearData.tax,
            netInterest: yearData.interest
        };
    });

    document.getElementById("investmentTableBody").innerHTML = tableHTML;
    document.getElementById("periodLabel").innerText = "Year";
}

function generateMonthlyTable(showTaxColumn) {
    const initial = parseFloat(document.getElementById("initial").value) || 0;
    const annual = parseFloat(document.getElementById("annual").value) || 0;
    const monthly = parseFloat(document.getElementById("monthly").value) || 0;
    const rate = parseFloat(document.getElementById("rate").value) / 100 || 0;
    const freq = parseInt(document.getElementById("frequency").value) || 1;
    const years = parseInt(document.getElementById("years").value) || 0;
    const months = parseInt(document.getElementById("months").value) || 0;
    const taxRate = parseFloat(document.getElementById("tax").value) / 100 || 0;
    const totalMonths = years * 12 + months;

    let tableHTML = "";
    let balance = initial;
    let totalContribution = initial;
    let totalGrossInterest = 0;
    let totalTaxPaid = 0;
    let totalNetInterest = 0;

    for (let month = 1; month <= totalMonths; month++) {
        let deposit = 0;
        let contributionThisMonth = 0;

        // Add monthly contribution
        if (monthly > 0) {
            deposit += monthly;
            contributionThisMonth += monthly;
        }

        // Add annual contribution at start of year
        if (month % 12 === 1 || month === 1) {
            deposit += annual;
            contributionThisMonth += annual;
        }

        totalContribution += contributionThisMonth;

        // Calculate interest and tax
        const periodicRate = Math.pow(1 + rate, 1 / (12 / freq)) - 1;
        let grossInterest = (balance + deposit) * periodicRate;
        let tax = grossInterest * taxRate;
        let netInterest = grossInterest - tax;

        // Update totals
        totalGrossInterest += grossInterest;
        totalTaxPaid += tax;
        totalNetInterest += netInterest;
        balance = totalContribution + totalNetInterest;

        // Add row to table
        if (showTaxColumn) {
            tableHTML += `
                <tr>
                    <td>${month}</td>
                    <td>${formatCurrency(month === 1 ? deposit + initial : deposit)}</td>
                    <td>${formatCurrency(totalContribution)}</td>
                    <td>${formatCurrency(grossInterest)}</td>
                    <td>${formatCurrency(tax)}</td>
                    <td>${formatCurrency(totalNetInterest)}</td>
                    <td>${formatCurrency(balance)}</td>
                </tr>`;
        } else {
            tableHTML += `
                <tr>
                    <td>${month}</td>
                    <td>${formatCurrency(month === 1 ? deposit + initial : deposit)}</td>
                    <td>${formatCurrency(totalContribution)}</td>
                    <td>${formatCurrency(netInterest)}</td>
                    <td>${formatCurrency(totalNetInterest)}</td>
                    <td>${formatCurrency(balance)}</td>
                </tr>`;
        }

        // Add year separator
        if (month % 12 === 0) {
            tableHTML += `
                <tr>
                    <td colspan="${showTaxColumn ? '8' : '6'}" style="text-align:center; font-weight:bold;">
                        End of year ${month / 12}
                    </td>
                </tr>`;
        }
    }

    document.getElementById("investmentTableBody").innerHTML = tableHTML;
    document.getElementById("periodLabel").innerText = "Month";
}

    function formatCurrency(value) {
        return '$' + value.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    // Initialize pie chart
    pieChart = new Chart(pieCtx, {
        type: "doughnut",
        data: {
            labels: ["Initial investment", "Contributions", "Interest", "Tax Paid"],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    "rgb(43, 125, 219)", 
                    "rgb(139, 188, 33)", 
                    "rgb(145, 0, 0)",
                    "rgb(200, 100, 0)"
                ],
                hoverBackgroundColor: [
                    "#2B65EC", 
                    "#5C821A", 
                    "#800000",
                    "#C86400"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        font: { size: 14 }
                    }
                },
                datalabels: {
                    color: "white",
                    font: { weight: "bold", size: 11 },
                    formatter: (value) => "0%"
                }
            },
            cutout: "50%"
        },
        plugins: [ChartDataLabels]
    });

    // Event listeners
    document.querySelector(".ci-btn button").addEventListener("click", calculateInterest);
    document.getElementById("downloadExcel").addEventListener("click", downloadExcel);

    function downloadExcel() {
        let table = document.querySelector("table");
        let ws = XLSX.utils.table_to_sheet(table);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Investment Data");
        XLSX.writeFile(wb, "Investment_Report.xlsx");
    }

    function initializeLiveUpdates() {
        const inputIds = [
            "initial", "annual", "monthly", "rate", "frequency",
            "years", "months", "tax", "inflation"
        ];
        inputIds.forEach(id => {
            document.getElementById(id).addEventListener("input", calculateInterest);
        });
    }

    // Tab switching
    const annualTab = document.getElementById("annualTab");
    const monthlyTab = document.getElementById("monthlyTab");

    function switchTab(tabName) {
        currentTab = tabName;
        annualTab.classList.toggle("active-tab", tabName === "annual");
        monthlyTab.classList.toggle("active-tab", tabName === "monthly");
        calculateInterest();
    }

    annualTab.addEventListener("click", () => switchTab("annual"));
    monthlyTab.addEventListener("click", () => switchTab("monthly"));

    // Initialize
    initializeLiveUpdates();
    calculateInterest();

});