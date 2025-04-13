document.addEventListener("DOMContentLoaded", function () {
    const barCtx = document.getElementById("barChart").getContext("2d");
    const pieCtx = document.getElementById("pieChart").getContext("2d");
    let barChart, pieChart;
    let currentTab = "annual";

    function calculateInterest() {
        const initialInvestment = parseFloat(document.getElementById("initial").value) || 0;
        const annualContribution = parseFloat(document.getElementById("annual").value) || 0;
        const monthlyContribution = parseFloat(document.getElementById("monthly").value) || 0;
        const rate = parseFloat(document.getElementById("rate").value) / 100 || 0;
        const years = parseInt(document.getElementById("years").value) || 0;
        const compoundingFrequency = parseInt(document.getElementById("frequency").value) || 1;

        let data = {
            labels: [],
            datasets: [
                { label: "Initial investment", data: [], backgroundColor: "rgb(43, 125, 219)" },
                { label: "Contributions", data: [], backgroundColor: "rgb(139, 188, 33)" },
                { label: "Interest", data: [], backgroundColor: "rgb(145, 0, 0)" }
            ]
        };

        let balance = initialInvestment;
        let totalContributions = 0;
        let interest = 0;

        for (let year = 1; year <= years; year++) {
            data.labels.push(year.toString());
            let yearlyDeposit = annualContribution + (monthlyContribution * 12);
            totalContributions += yearlyDeposit;
            balance = (balance + yearlyDeposit) * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency);
            interest = balance - (initialInvestment + totalContributions);

            data.datasets[0].data.push(initialInvestment);
            data.datasets[1].data.push(totalContributions);
            data.datasets[2].data.push(interest);
        }

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
                            stepSize: 10000,
                            callback: value => `$${value / 1000}K`
                        }
                    }
                }
            }
        });

        updatePieChart(initialInvestment, totalContributions, interest);

        document.getElementById("endingBalance").innerText = `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById("totalPrincipal").innerText = `$${(totalContributions + initialInvestment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById("totalContributions").innerText = `$${totalContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById("totalInterest").innerText = `$${interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (currentTab === "annual") {
            generateAnnualTable();
        } else {
            generateMonthlyTable();
        }
    }

    function updatePieChart(initial, contributions, interest) {
        let total = initial + contributions + interest;
        let percentages = [
            ((initial / total) * 100).toFixed(1),
            ((contributions / total) * 100).toFixed(1),
            ((interest / total) * 100).toFixed(1)
        ];

        pieChart.data.datasets[0].data = [initial, contributions, interest];
        pieChart.options.plugins.datalabels.formatter = (value, context) => percentages[context.dataIndex] + "%";
        pieChart.update();
    }

    pieChart = new Chart(pieCtx, {
        type: "doughnut",
        data: {
            labels: ["Initial investment", "Contributions", "Interest"],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ["rgb(43, 125, 219)", "rgb(139, 188, 33)", "rgb(145, 0, 0)"],
                hoverBackgroundColor: ["#2B65EC", "#5C821A", "#800000"]
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
                    formatter: (value, context) => "0%"
                }
            },
            cutout: "50%"
        },
        plugins: [ChartDataLabels]
    });

    document.querySelector(".ci-btn button").addEventListener("click", calculateInterest);
    document.getElementById("downloadExcel").addEventListener("click", function () {
        let table = document.querySelector("table");
        let ws = XLSX.utils.table_to_sheet(table);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Investment Data");
        XLSX.writeFile(wb, "Investment_Report.xlsx");
    });

    function generateAnnualTable() {
        const initial = parseFloat(document.getElementById("initial").value) || 0;
        const annual = parseFloat(document.getElementById("annual").value) || 0;
        const monthly = parseFloat(document.getElementById("monthly").value) || 0;
        const rate = parseFloat(document.getElementById("rate").value) / 100 || 0;
        const freq = parseInt(document.getElementById("frequency").value);
        const years = parseInt(document.getElementById("years").value) || 0;
        const months = parseInt(document.getElementById("months").value) || 0;
        const totalYears = years + months / 12;

        let balance = initial;
        let table = "";
        let totalInterest = 0;
        let totalContribution = initial;

        for (let year = 1; year <= Math.floor(totalYears); year++) {
            const deposit = annual + monthly * 12;
            totalContribution += deposit;
            balance = (balance + deposit) * Math.pow(1 + rate / freq, freq);
            const interest = balance - totalContribution;

            table += `
            <tr>
                <td>${year}</td>
                <td>$${(year === 1 ? deposit + initial : deposit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${(interest - totalInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>`;
            totalInterest = interest;
        }

        document.getElementById("investmentTableBody").innerHTML = table;
        document.getElementById("periodLabel").innerText = "Year";
    }

    function generateMonthlyTable() {
        const initial = parseFloat(document.getElementById("initial").value) || 0;
        const annual = parseFloat(document.getElementById("annual").value) || 0;
        const monthly = parseFloat(document.getElementById("monthly").value) || 0;
        const rate = parseFloat(document.getElementById("rate").value) / 100 || 0;
        const freq = parseInt(document.getElementById("frequency").value);
        const years = parseInt(document.getElementById("years").value) || 0;
        const months = parseInt(document.getElementById("months").value) || 0;
        const totalMonths = years * 12 + months;

        let balance = initial;
        let table = "";
        let totalInterest = 0;
        let totalContribution = initial;

        for (let month = 1; month <= totalMonths; month++) {
            const deposit = monthly;
            totalContribution += deposit;
            balance = (balance + deposit) * Math.pow(1 + rate / freq, freq / 12);
            const interest = balance - totalContribution;

            table += `
            <tr>
                <td>${month}</td>
                <td>$${(month === 1 ? deposit + annual + initial : deposit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${(interest - totalInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>`;
            totalInterest = interest;
        }

        document.getElementById("investmentTableBody").innerHTML = table;
        document.getElementById("periodLabel").innerText = "Month";
    }

    calculateInterest(); // Run initially on load

    // Function to initialize event listeners for live updates
    function initializeLiveUpdates() {
    const inputIds = [
        "initial", "annual", "monthly", "rate", "frequency",
        "years", "months", "tax", "inflation"
    ];

    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
        element.addEventListener("input", calculateInterest);
        }
    });
    }

    // Call this function after the DOM has loaded
    window.addEventListener("DOMContentLoaded", () => {
    initializeLiveUpdates();
    calculateInterest(); // Initial calculation with default values
    });

    // Tab switching logic
    document.getElementById("annualTab").addEventListener("click", function () {
        currentTab = "annual";
        this.classList.add("active-tab");
        document.getElementById("monthlyTab").classList.remove("active-tab");
        calculateInterest();
    });

    document.getElementById("monthlyTab").addEventListener("click", function () {
        currentTab = "monthly";
        this.classList.add("active-tab");
        document.getElementById("annualTab").classList.remove("active-tab");
        calculateInterest();
    });
});