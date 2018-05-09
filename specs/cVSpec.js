describe("cV", function(){
	require('../cV.js');

	it ("Should be able to Create v1 cV", function(){
		
		correlationVector.useCv1();
		correlationVector.init();
		var val = correlationVector.getValue();

		 split = val.split('.');
		if (split.length !== 2)
		{
			fail("Newly Seeded Server cV is expecting two segments");
		}

		if (parseInt(split[1]) !== 0 )
		{
			fail("Server Seeded cV should have a 0 in the first extention");
		}
		if (split[0].length !== 16)
		{
			fail("Server Seeded v1 cV base should be 16 characters in length");
		}
		expect(1).toEqual(1);
	});

	it ("Should be able to Create v2 cV", function(){
		correlationVector.useCv2();
			
		correlationVector.init();
		var val = correlationVector.getValue();

		 split = val.split('.');
		if (split.length !== 2)
		{
			fail("Newly Seeded Server cV is expecting two segments");
		}

		if (parseInt(split[1]) !== 0 )
		{
			fail("Server Seeded cV should have a 0 in the first extention");
		}
		if (split[0].length !== 22)
		{
			fail("Server Seeded v1 cV base should be 22 characters in length");
		}
		expect(1).toEqual(1);
	});

	it ("Should be able to increment cV", function(){
		correlationVector.useCv2();
		correlationVector.init();
		correlationVector.increment();

		var val = correlationVector.getValue();
		
		split = val.split('.');

		 if (parseInt(split[1]) !== 1)
		 {
			 fail("Expected 1 on increment but got " + split[1]);
		 }
		 expect(1).toEqual(1);
	});


	it ("Should be able to Spin cV", function(){
		correlationVector.useCv2();
		
		correlationVector.init();
		correlationVector.spin();
		var val = correlationVector.getValue();
		
		split = val.split('.');

		// after a spin, cV should be <base>.0.<spinValue>.0
		if (parseInt(split[1]) !== 0)
		{
			fail("Expected 0 but got " + split[1]);
		}

		if (parseInt(split[3]) !== 0)
		{
			fail("Expected 0 but got " + split[3]);
		}
		expect(1).toEqual(1);
	});


	it ("Should be able to Spin should Aways be getting bigger", function(){
		correlationVector.useCv2();
		correlationVector.init();
		for(i = 0; i < 9; i++)
		{
		correlationVector.spin();
		}
		
		var val = correlationVector.getValue();
		
		var split = val.split('.');

		// after a spin, cV should be <base>.1.0.<spinValue>.0.<spinVlaue> ...
		// spin values should be always increasing
		var current = parseInt(split[3]);
		for (i = 5 ; i < split.length; i++)
		{
			if (parseInt(split[i] !== 0)) {
			
				if (current < parseInt(split[i])) {
					fail("Spin value didn't increase, index "+ i + " cV:" + val);
				}
			current = parseInt(split[i]);
			}
		}
		expect(1).toEqual(1);
	});
});