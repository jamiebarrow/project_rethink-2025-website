(function() {
	const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	const today = extractToday();

	Mousetrap.bind('left', function(e) {
		gotoDate(addDay(today, -1));
	});
	Mousetrap.bind('right', function(e) {
		gotoDate(addDay(today, 1));
	});

	function gotoDate(date) {
		const year = date.year;
		const month = String(date.month).padStart(2, 0);
		const day = String(date.day).padStart(2, 0);
		location.pathname = `./${year}-${month}-${day}.html`
	}

	function extractToday() {
		const match = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec(location.href);
		const today = { year: parseInt(match.groups.year, 10), month: parseInt(match.groups.month, 10), day: parseInt(match.groups.day, 10) };
		return today;
	}

	function addDay(date, delta) {
		let month = date.month;
		let day = date.day + delta;

		if (day > daysInMonth[month - 1]) {
			day = 1;
			month++;
			if (month > 12) {
				month = 1;
			}
		} else if (day < 1) {
			month--;
			if (month < 1) {
				month = 12;
			}
			day = daysInMonth[month - 1];
		}

		return { year: date.year, month, day };
	}
})();
