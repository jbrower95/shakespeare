import requests
import re
from bs4 import BeautifulSoup
import json

def downloadAndParse(play):
	url = "http://www.opensourceshakespeare.org/views/plays/play_view.php?WorkID=" + play + "&Scope=entire"
	print "[Downloading] " + play
	content = requests.get(url).text
	soup = BeautifulSoup(content, 'html.parser')
	script = {"lines" : [], "characters" : []}
	i = 0
	line = 0

	for result in soup.find_all(lambda tag: tag.get('class') and ("playtext" in tag.get('class') or "stagedir" in tag.get('class'))): # soup.select(".playtext, .stagedir"):
		if "stagedir" in result["class"]:
			# this is for the narrator.
			if not "narrator" in script["characters"]: script["characters"].append("narrator")
			script["lines"].append({"character" : "narrator", "content" : result.getText().strip()})
		else:
			# this is a general directive. find out which character.
			character = result.find("a")
			character.extract()

			char_name = character.getText().strip().lower();
			line_number = result.find("a")

			if not char_name in script["characters"]: script["characters"].append(char_name)
			
			line = int(line_number["name"])
			line_number.extract()

			# extract any play line nums that would ruin the text.
			play_line_num = result.select(".playlinenum")
			for elt in play_line_num:
				elt.extract()

			scene_txt = result.getText()[2:].strip()
			script["lines"].append({"character" : char_name, "content" : scene_txt, "line" : line})
	return script

plays = "hamlet allswell asyoulikeit comedyerrors antonycleo romeojuliet tamingshrew tempest 12night".split()

def main():
	scripts = {}
	if not plays:
		while raw_input("Download another? (y/N)") == "y":
			play = raw_input("Enter play code to download: ").strip()
			try:
				scripts[play] = downloadAndParse(play)
			except Exception as e:
				print "[error] {}".format(e)
	else:
		print "Downloading {} plays.".format(len(plays))
		for play in plays:
			try:
				scripts[play] = downloadAndParse(play)
			except Exception as e:
				print "[error] {}".format(e)
	outfile = raw_input("Enter file to write to: ")
	if outfile:
		with open(outfile, "w+") as f:
			f.write(json.dumps(scripts, indent=4, sort_keys=False))
	else:
		print "Abandoned."

if __name__ == "__main__":
	main()

