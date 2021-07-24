#never save anything here

x = [[7,8], [4,5,6], [1,2,3]]

def gen(l):
    if not l:
        yield ()
    else:
        for _ in l[0]:
            for __ in gen(l[1:]):
                yield (_,) + __

for _ in gen(x):
    print(_)
